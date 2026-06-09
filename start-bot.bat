@echo off
cd /d "C:\Users\KYLIAN\Desktop\yourazz-license-bot"
pm2 start ecosystem.config.js
pm2 save
