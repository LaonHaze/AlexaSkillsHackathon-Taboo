const Alexa = require('ask-sdk');

const NumRoundsHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    
    return request.type === 'IntentRequest'
      && request.intent.name === 'NumberIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    
    const totalRounds = request.intent.slots.number.value;
    
    sessionAttributes.totalRounds = totalRounds;
    sessionAttributes.currentRound = 0;
    
    const MESSAGE_ROUNDS = `You have chosen ${totalRounds} rounds! Choose a difficulty: easy, medium or hard?`;
    const REPROMPT_ROUNDS = 'Would you like to pick easy, medium or hard?';

    return handlerInput.responseBuilder
      .speak(MESSAGE_ROUNDS)
      .reprompt(REPROMPT_ROUNDS)
      .getResponse();
  },
}

const PlayerNameHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        
        return request.type === 'IntentRequest'
            && request.intent.name === 'PlayerNameIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;
        
        const playerName = request.intent.slots.name.value;
        
        sessionAttributes.playerOneName = playerName;
        
        const NAME_MESSAGE = 'Is your name'
        
        return handlerInput.responseBuilder
        .speak(NAME_MESSAGE)
        .getResponse();
    },
}

exports.NumRoundsHandler = NumRoundsHandler;