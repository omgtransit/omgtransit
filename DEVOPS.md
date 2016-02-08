DevOps Stuff
========================================

# Monit
========================================
Monit monitors all of the system processes every 2 minutes and responds accordingly.  It should send out alerts depending on the problem.

Log File - /var/log/monit.log
Config File - /etc/monit/monitrc

## Monit Commands
Reload with a new configuration file. 
$ monit reload
Check the config file for syntax errors.
$ monit -t

# Upstart Scripts
========================================

## gutapi
This service handles all of the operations involved in getting the api layer up and running.
Path - /etc/init/gutapi.conf
$ sudo service gutapi restart


# Redis
========================================
$ sudo service redis-server restart

# Transit API
========================================
$ sudo service gutapi restart

# Nginx
========================================
$ sudo service nginx restart