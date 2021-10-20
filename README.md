# FCM NODE ADMIN SDK

## API doc

### Get list of client tokens

`/api/fcm/token/list` [GET]

*Response:*
```JSON
{
  "clientTokens": [
    {
      "uuid": "<string>",
      "token": "<string>"
    }
  ]
}
```


### Send token to Server

`/api/fcm/token/save` [POST]

*Body:*
```JSON
{
   "token": "required string",
   "uuid": "<empty for new | required for subscribed user>" 
} 
```
For the first time of token saving, you can ignore `uuid`, server will generate and return `uuid` and `token` as response. 
`uuid` must be set for next saving token after uuid was generated   

*Response for new token*
```JSON
{ 
  "message": "token is saved", 
  "data": { 
    "uuid": "", 
    "token": "" 
  } 
}
```
*Response for subscribed token*

```JSON
{ 
  "message": "token is updated", 
  "data": { 
    "uuid": "", 
    "token": "" 
  } 
}
```
### Delete token from Server

`/api/fcm/token/delete/{uuid}` [DELETE]

Param: `uuid`

### Subscribe to topic
`/api/fcm/topic/subscribe` [POST]

*Body:*
```JSON
{ 
   "topic": "", 
   "uuid": "" 
} 
```

### Unsubscribe from topic

`/api/fcm/topic/unsubscribe` [DELETE]

*Body:*
```JSON
{ 
   "topic": "", 
   "uuid": "" 
}
```

### Send message to uuid
`/api/fcm/send/message` [POST]

*Body:*
```JSON
{ 
   "type":"data | default", 
   "uuid": "",
   "title": "" ,
   "body": "" 
}
```
`type`'s value accepts two string ['data', 'default']

See: ['message types'](https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages)

### Send message to topic
`/api/fcm/send/message/topic` [POST]

*Body:*
```JSON
{ 
   "type": "", 
   "topic": "", 
   "title": "",
   "body": "" 
} 
```