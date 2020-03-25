#!/bin/bash

##################
# VARIABLES
###################

TIME=$(date +%Y-%m-%d_%H:%M)
DATE=$(date +%Y-%m-%d)
DIR="/opt/corona-api/data"

##################
# SETUP
###################

echo "[*] Starting Daily Data Dump " + $TIME

mkdir -p $DIR/$DATE

cd $DIR/$DATE

if [ ! -d "$DIR/$DATE/coronadatascraper" ]
then
  git clone --recursive https://github.com/lazd/coronadatascraper
  echo "[*] Repo successfully cloned"
else 
  cd $DIR/$DATE/coronadatascraper
  git pull 
  echo "[*] Repo successfully updated"
fi

##################
# WORK
###################

cd $DIR/$DATE/coronadatascraper

echo "[*] Installing coronadatascraper..."
/usr/local/bin/yarn install

echo "[*] Starting coronadatascraper..."

/usr/local/bin/yarn start

if [ -e "$DIR/$DATE/data.json" ]
then
  mv $DIR/$DATE/data.json{,.$(date +%Y%m%d-%H%M)}
fi

cp $DIR/$DATE/coronadatascraper/dist/data.json $DIR/$DATE

echo "[*] Data successfully dumped " + $TIME

##################
# CLEAN-UP
###################

echo ""
echo "[*] Cleaning up data scrape"

cd $DIR/$DATE
rm -rf coronadatascraper

if [ -e "$DIR/$DATE/data.json" ]
then
  PAYLOAD="{
    \"blocks\": [
      {
        \"type\":\"section\",
        \"text\": {
          \"type\":\"mrkdwn\",
          \"text\":\"🚀 API source data updated at *$TIME*\"
        }
      },
      {
        \"type\":\"divider\"
      },
      {
        \"type\":\"context\",
        \"elements\": [
          {
	    \"type\":\"mrkdwn\",
	    \"text\":\"For more info, checkout ssh:\/\/ec2-18-195-101-161.eu-central-1.compute.amazonaws.com\"
          }
        ]
      }
    ]
  }"

  curl -X POST --data-urlencode "payload=$PAYLOAD" $SLACK_URL >> /dev/null 2>&1
fi

echo "[*] Daily Script Complete!"

