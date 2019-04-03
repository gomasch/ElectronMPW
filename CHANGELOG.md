
# Changelog of Electron MPW
All notable changes to this project shall be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

# [1.0.2.0] - 2019-04-03
## Added
- file menu on win+mac with keyboard shortcuts for open and save etc.
## Changed
- updated all packages, electron is now 4.0.4
- back to normal font style for calculated pw (is not monospace anymore)
## Fixed
- fixed saving the user settings: typically the folder wasn't there and this threw an exception (happened on first start because the default path is changed and the save code did not try to create the missing directories, now it does)

# [1.0.1.0] - 2018-02-25
## Added
- added this changelog file
- added standard menu for Mac to support copy/paste shortcuts, this also adds a basic about dialog
## Changed
- visible application name is now 'Electron MPW'
- slightly updated npm packages, e.g. to Electron 1.7.8 -> 1.7.11
## Fixed
- active search doesn't hide the entry in edit mode anymore

# [1.0.0] - 2017-10-30
## Added
- Initial release. Works reasonably well on Mac (El Capitan) and Win (10, x64), based on Electron 1.7.8.
