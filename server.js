'use strict';
// ---------------- CONST DECLARATION ----------------------------
const environment = 'production'; //other than "production" will trigger the every-5-minute message for debug. CAREFUL


const line = require('@line/bot-sdk');
const express = require('express');
const schedule = require('node-schedule');
const firebase = require('firebase');
const axios = require('axios');
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDB07KBudnR-dV9skVIXdLnf9meaPvFx6M",
  authDomain: "morningbot-34fbf.firebaseapp.com",
  databaseURL: "https://morningbot-34fbf.firebaseio.com",
  projectId: "morningbot-34fbf",
  storageBucket: "morningbot-34fbf.appspot.com",
  messagingSenderId: "1065009382820"
};
firebase.initializeApp(firebaseConfig);
const imageApiClientId = '1441f9354466d72c3ee9d6d6fd4a8ad8cb1d103382e04742a505ff98d86e9ad2'; //api key for get image from unsplash

const database = firebase.database();

// create LINE SDK config from env variables
const config = {
  channelAccessToken: "7rPTfmTbWC/jnLNj3m2m2ch4BctqmlaESnbgZM2EkS9kdUR5+fhMOCzF7bmx+WT+c8m2garMnd0QLbggwUsJXFpm/IMwKVVE/UHuiGzCzZP91d0jtkZD3mGtwTF1fpIOKyi/d/DMsvtRu110GpEr5QdB04t89/1O/w1cDnyilFU=",
  channelSecret: "2bb43ed7f382f1f890adc7728aff6ed4",
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

const salute = [
  "cutie pie",
  "my love",
  "darling",
  "my angel",
  "my star",
  "sugar",
  "lovely",
  "wonderful person",
  "baby",
  "sweety",
  "sweetheart",
  "honey",
  "my valentine",
  "sunshine",
  "cookie"
];

var quotes;
// ---------------- END CONST DECLARATION ----------------------------

var job = {
  morning: null,
  lunch: null,
  dinner: null,
  night: null,
  test: null
};

createJob(); //create a queu job
getQuotes(); //get quotes from firebase, dump in working memory

// register a webhook handler with line middleware (mandatory for receiving request). has to use "callback"
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(200).end();
    });
});

//get quotes from firebase
function getQuotes(){
  firebase.database().ref('/messages/').once('value').then(messages => {
      quotes = messages.val();
  });
}

//get "nani??!? image for unexpected chat type
function getImageUrl(){
  var imagesUrl = [
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2F60871698.jpg?1543077630787",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fnani1.jpg?1543077331686",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2F6986c7555a4621d32301f03fa16376ff60527032.jpg?1543077632847",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fa9f.jpg?1543077648049",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fa7b5j3.jpg?1543077646883",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fa2401f86055fff35cedd47e8fa4d41a1.jpg?1543077647037",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fnani-5aa6e8.jpg?1543077660538",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fnani-5af051.jpg?1543077661317",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fhqdefault.jpg?1543077661631",
    "https://cdn.glitch.com/18774b30-7ad2-4c8c-8cfd-17f22df15b69%2Fnani.jpg?1543077663707"
  ];
  
  return imagesUrl[Math.round(Math.random()*imagesUrl.length)];
}


function pushMessage(category='morning'){
  //get user profileId from firebase
  firebase.database().ref('/users/').once('value').then(users => {
    users.forEach(user => {
      var url;
      
      //deciding what image should we send
      switch(category){
        case 'morning': url = 'https://api.unsplash.com/photos/random?query=love&per_page=1&client_id=' + imageApiClientId; break;
        case 'lunch': url = 'https://api.unsplash.com/photos/random?query=lunch&per_page=1&client_id=' + imageApiClientId; break;
        case 'dinner': url = 'https://api.unsplash.com/photos/random?query=dinner&per_page=1&client_id=' + imageApiClientId; break;
        case 'night': url = 'https://api.unsplash.com/photos/random?query=night&per_page=1&client_id=' + imageApiClientId; break;
        default: url = 'https://api.unsplash.com/photos/random?query=love&per_page=1&client_id=' + imageApiClientId; break;
      }
      
      axios.get(url)
        .then(response => {
          // console.log(response.data.url);
          // console.log(response.data.explanation);
        
          var messages = [];
          messages.push({
            "type": "image",
            "originalContentUrl": response.data.urls.regular,
            "previewImageUrl": response.data.urls.small
          });
          
          //apend message for morning greeting
          if(category=='morning'){
            messages.push({
              'type': 'text',
              'text': '"' + quotes[Math.round(Math.random()*quotes.length)].message.trim() + '"\n- ' + quotes[Math.round(Math.random()*quotes.length)].author.trim()
            });

            messages.push({
              'type': 'text',
              'text': 'Good morning ' + salute[Math.round(Math.random()*salute.length)] + ' <3'
            });
          }
          
          //apend message for lunch greeting
          else if(category=='lunch'){
            messages.push({
              'type': 'text',
              'text': 'Have a nice lunch ' + salute[Math.round(Math.random()*salute.length)] + '~~'
            });
          }
        
          //apend message for dinner greeting
          else if(category=='dinner'){
            messages.push({
              'type': 'text',
              'text': 'Hope you have a nice dinner ' + salute[Math.round(Math.random()*salute.length)] + ':]'
            });
          }
          
          //apend message for night greeting
          else if(category=='night'){
            messages.push({
              'type': 'text',
              'text': 'Good night ' + salute[Math.round(Math.random()*salute.length)] + ' :]\nHave a nice sleep!'
            });
          }
          
        
          //SEND ALL THE MESSAGES!!!
          client.pushMessage(user.val().profileId, messages)
            .then(() => {
              console.log("success push");
            })
            .catch((err) => {
              console.log(err);
            }); 
        })
        .catch(error => {
          console.log(error);
        }); //end of axios
      
    }); //end of foreach
  });//end of firebase ref
  
}

//create cron job for every day
function createJob(){
  var rule;
  
  //morning (08.00 GMT+7)
  rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [new schedule.Range(0, 6)];
  rule.hour = 1;
  rule.minute = 0;
  job.morning = schedule.scheduleJob(rule, function(){
    pushMessage('morning');
  });
  
  
  //lunch (12.00 GMT+7)
  rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [new schedule.Range(0, 6)];
  rule.hour = 5; //5
  rule.minute = 0; //0
  job.lunch = schedule.scheduleJob(rule, function(){
    pushMessage('lunch');
  });
  
  
  //dinner (19.00 GMT+7)
  rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [new schedule.Range(0, 6)];
  rule.hour = 12; //12
  rule.minute = 0; //0
  job.lunch = schedule.scheduleJob(rule, function(){
    pushMessage('dinner');
  });
  
  
  //night (21.00 GMT+7)
  rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [new schedule.Range(0, 6)];
  rule.hour = 14; //14
  rule.minute = 0; //0
  job.night = schedule.scheduleJob(rule, function(){
    pushMessage('night');
  });
  
  //test -- for test, run every minute --- FOR DEVELOPMENT USE ONLY
  if(environment != 'production'){
    job.test = schedule.scheduleJob('*/5 * * * *', function(){
      pushMessage('test');
    });
  }
}

//delete user data from firebase so user won't receive message
function cancelJob(paramProfileId){
  firebase.database().ref('users/' + paramProfileId).remove();
}

// event handler
function handleEvent(event) {
  //if not text message, don't echo it. send nani??!? meme instead
  if (event.type !== 'message' || event.message.type !== 'text') {
    var imageUrl = getImageUrl();
    var message = {
      "type": "image",
      "originalContentUrl": imageUrl,
      "previewImageUrl": imageUrl
    };
    
    return client.replyMessage(event.replyToken, message);
  }
  
  //if user type "subscribe", subscribe him to message queue
  if(event.message.text.toLowerCase() == "subscribe"){
    var profileId = event.source.userId;
    
    var d = new Date();
    //add user profileId to firebase
    firebase.database().ref('users/' + profileId).set({
      profileId: profileId,
      added: d.toString()
    });
    
    console.log('subscribed: ' + profileId);
    
    //send notification
    return client.replyMessage(event.replyToken, {type: 'text', text: 'You\'ve subscribed to receive daily message <3'});
  }
  
  //if user decided to stop the subscription, delete his data in firebase
  if(event.message.text.toLowerCase() == "stop subscribe" || event.message.text.toLowerCase() == "stop" || event.message.text.toLowerCase() == "stop_subscribe"){
     cancelJob(event.source.userId);
    
    return client.replyMessage(event.replyToken, {type: 'text', text: 'ok, ok. I won\'t send any cute message again.\nchill, man :|'});
  }
  
  // create a echoing text message -> just for fun
  const echo = { type: 'text', text: 'You type: "' + event.message.text + '"\n\nWhat are you expecting? I\'m just a simple bot built in one night.Beep Bop. Beep Bop.\n\nONE single night.' };
  
  // send the reply message
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});