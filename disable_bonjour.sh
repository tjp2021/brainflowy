#!/bin/bash

# Disable Bonjour/mDNS advertisements
echo "Disabling Bonjour multicast advertisements..."

# This stops your Mac from broadcasting services
sudo defaults write /Library/Preferences/com.apple.mDNSResponder.plist NoMulticastAdvertisements -bool YES

# Restart mDNS to apply changes
sudo killall mDNSResponder

echo "Bonjour advertisements disabled. Your Mac won't broadcast services anymore."
echo "To re-enable: sudo defaults delete /Library/Preferences/com.apple.mDNSResponder.plist NoMulticastAdvertisements"