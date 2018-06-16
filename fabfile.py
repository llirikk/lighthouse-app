import datetime
import os
from fabric.api import env, run, roles, task
from fabric.contrib.project import mkdtemp
from fabric.operations import local, put, sudo
from fabric.context_managers import cd


env.roledefs = {
    'production': {
        'hosts': ['user@production_host'],
    },
    'staging': {
        'hosts': ['user@staging_host']
    }
}


@roles('production')
def deploy_prod():
    set_env()
    deploy()


@roles('staging')
def deploy_staging():
    set_env()
    deploy()


def deploy():
    checkout()
    link_previous_release()
    link_current_release()
    copy_settings()
    install_packages()
    restart_app(use_sudo=True)


def set_env():
    env.user = 'lumo'
    env.exclude_ignore = 'conf/tarexclude'
    env.nginx_conf = 'conf/lighthouse.conf'
    env.supervisor_conf = 'conf/lighthouse.ini'
    env.settings_path = '/home/{}/lighthouse/settings'.format(env.user)
    env.releases_path = '/home/{}/lighthouse/releases'.format(env.user)
    env.npm_path = '/home/{}/.nvm/versions/node/v10.4.1/bin/npm'.format(env.user)


def copy_settings(use_sudo=False):
    runner = use_sudo and sudo or run
    with cd(env.settings_path):
        runner('cp default.json {}'.format(os.path.join(env.releases_path, env.current_release, 'conf')))


def install_packages(use_sudo=False):
    runner = use_sudo and sudo or run
    with cd(os.path.join(env.releases_path, env.current_release)):
        runner('{} install --loglevel silent'.format(env.npm_path))


def checkout():
    env.current_release = '{timestamp}'.format(**{
        'timestamp': datetime.datetime.now().strftime('%Y%m%d%H%M%S')})

    run('mkdir -p {releases_path}/{current_release}'.format(**{
        'releases_path': env.releases_path,
        'current_release': env.current_release}))

    upload_project(remote_dir=os.path.join(env.releases_path, env.current_release),
                   exclude_ignore=env.exclude_ignore,
                   use_sudo=True)


def restart_app(use_sudo=False):
    runner = use_sudo and sudo or run
    runner('supervisorctl restart lighthouse')


def link_previous_release(use_sudo=False):
    runner = use_sudo and sudo or run
    with cd(env.releases_path):
        runner('rm prev')
        runner('cp -P current prev')


def link_current_release(use_sudo=False):
    runner = use_sudo and sudo or run
    with cd(env.releases_path):
        runner('rm current')
        runner('ln -s {} current'.format(env.current_release))


def upload_project(local_dir=None, remote_dir="", exclude_ignore=None, use_sudo=False):
    runner = use_sudo and sudo or run

    local_dir = local_dir or os.getcwd()

    # Remove final '/' in local_dir so that basename() works
    local_dir = local_dir.rstrip(os.sep)

    local_path, local_name = os.path.split(local_dir)
    tar_file = '{}.tar.gz'.format(local_name)
    target_tar = os.path.join(remote_dir, tar_file)
    tmp_folder = mkdtemp()

    try:
        tar_path = os.path.join(tmp_folder, tar_file)
        if not exclude_ignore:
            local('tar -czf {} -C {} {}'.format(tar_path, local_path, local_name))
        else:
            local('tar -czf {} -C {} {} --exclude-ignore={}'.format(tar_path, local_path, local_name, exclude_ignore))
        put(tar_path, target_tar, use_sudo=use_sudo)
        with cd(remote_dir):
            try:
                runner('tar -xzf {}'.format(tar_file))
                runner('mv lighthouse-app/* .')
                runner('rm -rf lighthouse-app')
            finally:
                runner('rm -f {}'.format(tar_file))
    finally:
        local('rm -rf {}'.format(tmp_folder))
