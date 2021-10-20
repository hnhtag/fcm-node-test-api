const router = require('express').Router()
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require('firebase-admin/messaging')
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// json file generated from firebase console's prject setting
const serviceAccount = require("../serviceAccount.sample.json");

// firebase admin app
const fireApp = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://<project>.firebaseio.com"
});

// init firebase messaging
const messaging = getMessaging(fireApp)

const topics = ['promotion', 'notic']
let clientTokens = []

// save token from client
router.post('/token/save', async (req, res) => {
  let { uuid, token, clientType = 'web' } = req.body

  // body params check
  if (!token) return res.status(422).json({ message: 'token is required' })
  if (uuid && !uuidValidate(uuid)) return res.status(422).json({ message: 'invalid uuid' })

  if (!uuid) {
    uuid = uuidv4()
    clientTokens.push({ uuid, token, type: clientType, subscribedTopics: [] })

    return res.status(201).json({ message: 'token is saved', data: { uuid, token } })
  } else {
    let uuidIndex = -1
    uuidIndex = clientTokens.findIndex(ctoken => ctoken.uuid === uuid)

    if (uuidIndex > -1) {
      clientTokens[uuidIndex].token = token
      return res.status(200).json({ message: 'token is updated', data: { uuid, token } })
    }
    else return res.status(422).json({ message: 'uuid is not found' })
  }
})

// delete token by uuid
router.delete('/token/delete/:uuid', async (req, res) => {
  let { uuid } = req.params

  // body params check
  if (!uuid) return res.status(422).json({ message: 'uuid is required' })
  if (uuid && !uuidValidate(uuid)) return res.status(422).json({ message: 'invalid uuid' })

  let uuidIndex = -1
  uuidIndex = clientTokens.findIndex(ctoken => ctoken.uuid === uuid)

  if (uuidIndex > -1) {
    clientTokens.splice(uuidIndex, 1);
    return res.status(200).json({ message: 'token is deleted' })
  }
  else return res.status(422).json({ message: 'uuid is not found' })
})

// get client token list
router.get('/token/list', async (req, res) => {
  return res.status(200).json({ clientTokens })
})

// subscribe to topic [individual]
router.post('/topic/subscribe', async (req, res) => {
  let { topic, uuid } = req.body

  // body params check
  if (!topic) return res.status(422).json({ message: 'topic is required' })
  if (!topics.includes(topic)) return res.status(422).json({ message: 'invalid topic' })
  if (!uuid) return res.status(422).json({ message: 'uuid is required' })
  if (uuid && !uuidValidate(uuid)) return res.status(422).json({ message: 'invalid uuid' })

  let uuidIndex = -1
  uuidIndex = clientTokens.findIndex(ctoken => ctoken.uuid === uuid)

  if (uuidIndex > -1) {
    if (!clientTokens[uuidIndex].subscribedTopics)
      clientTokens[uuidIndex].subscribedTopics = []

    let token = clientTokens[uuidIndex].token
    if (!token) return res.status(422).json({ message: 'client\'s token is missing' })

    let fcmRes = messaging.subscribeToTopic(token, topic)
    console.log('Successfully subscribed to topic:', fcmRes);

    // store subscribed topic for each uuid
    clientTokens[uuidIndex].subscribedTopics.push(topic)

    return res.status(200).json({ message: 'subscribed to ' + topic })
  }
  else return res.status(422).json({ message: 'uuid is not found' })
})

// unsubscribe to topic [individual]
router.delete('/topic/unsubscribe', async (req, res) => {
  let { topic, uuid } = req.body

  // body params check
  if (!topic) return res.status(422).json({ message: 'topic is required' })
  if (!topics.includes(topic)) return res.status(422).json({ message: 'invalid topic' })
  if (!uuid) return res.status(422).json({ message: 'uuid is required' })
  if (uuid && !uuidValidate(uuid)) return res.status(422).json({ message: 'invalid uuid' })

  let uuidIndex = -1
  uuidIndex = clientTokens.findIndex(ctoken => ctoken.uuid === uuid)

  if (uuidIndex > -1) {
    if (!clientTokens[uuidIndex].subscribedTopics)
      clientTokens[uuidIndex].subscribedTopics = []

    let token = clientTokens[uuidIndex].token
    if (!token) return res.status(422).json({ message: 'client\'s token is missing' })

    // delete subscribed topic for uuid
    let foundTopicIndex = -1
    foundTopicIndex = clientTokens[uuidIndex].subscribedTopics.findIndex(stopic => stopic == topic)
    if (foundTopicIndex > -1) {
      let fcmRes = messaging.unsubscribeFromTopic(token, topic)
      console.log('Successfully subscribed to topic:', fcmRes);

      clientTokens[uuidIndex].subscribedTopics.splice(foundTopicIndex, 1)

      return res.status(200).json({ message: 'unsubscribed from ' + topic })
    } else return res.status(422).json({ message: 'uuid\'s topic is not found' })

  }
  else return res.status(422).json({ message: 'uuid is not found' })
})

// send message to uuid [individual]
router.post('/send/message', async (req, res) => {
  let { uuid, type, title, body } = req.body
  let message = {};

  // body params check
  if (!uuid) return res.status(422).json({ message: 'uuid is required' })
  if (uuid && !uuidValidate(uuid)) return res.status(422).json({ message: 'invalid uuid' })
  if (!type) return res.status(422).json({ message: 'type is required' })
  if (!title) return res.status(422).json({ message: 'title is required' })
  if (!body) return res.status(422).json({ message: 'body is required' })

  // message payload type [data | notification] 
  if (type == 'data') messagePayload = 'data'
  else if (type == 'default') messagePayload = 'notification'
  else return res.status(422).json({ message: 'invalid notification type' })

  let client = clientTokens.find(ct => ct.uuid == uuid)

  if (!client || (client && !client.uuid)) return res.status(422).json({ message: 'client may not be registered correctly' })

  let { token } = client
  if (!token) return res.status(422).json({ message: 'client\'s token is missing' })

  try {
    if (client.type == 'web') {
      message = { [messagePayload]: { title, body }, token }
      await messaging.send(message)
      return res.status(200).json({ message: 'message is sent to ' + client.type })
    }
    else if (client.type == 'android') {
      message = { [messagePayload]: { title, body } }
      await messaging.sendToDevice(token, message)
      return res.status(200).json({ message: 'message is sent to ' + client.type })
    }
  } catch (err) {
    return res.status(500).json({ message: 'error while sending message', error: err })
  }
})

// send message to topic
router.post('/send/message/topic', async (req, res) => {
  let { type, topic, title, body } = req.body
  let message = {};

  // body params check
  if (!type) return res.status(422).json({ message: 'type is required' })
  if (!topic) return res.status(422).json({ message: 'topic is required' })
  if (!topics.includes(topic)) return res.status(422).json({ message: 'invalid topic' })
  if (!title) return res.status(422).json({ message: 'title is required' })
  if (!body) return res.status(422).json({ message: 'body is required' })

  if (type == 'data') messagePayload = 'data'
  else if (type == 'default') messagePayload = 'notification'
  else return res.status(422).json({ message: 'invalid notification type' })

  message = { [messagePayload]: { title, body }, }

  try {
    await messaging.sendToTopic(topic, message)
    return res.status(200).json({ message: 'topic message is sent', data: { topic, message } })
  } catch (err) {
    return res.status(500).json({ message: 'error while sending message', error: err })
  }
})

module.exports = router
