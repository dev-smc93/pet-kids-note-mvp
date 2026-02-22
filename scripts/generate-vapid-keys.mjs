#!/usr/bin/env node
import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();
console.log("VAPID 키를 .env에 추가하세요:\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
