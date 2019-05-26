/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const JamesHandler = require('jameshandler.js');

function ApplyWhisperEffect(message) {
  return `<prosody rate=\"slow\" volume=\"-40dB\">${message}</prosody>`;
}

function ApplyMenVoice(message) {
  return `<voice name=\"Matthew\">${message}</voice>`;
}

function NewRound (handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  
  let pName1 = sessionAttributes.p1.name;
  let pName2 = sessionAttributes.p2.name;
  
  if((sessionAttributes.p1.score === 0) && (sessionAttributes.p2.score === 0)) {
    sessionAttributes.tabooArray = aladdin;
  } else {
    sessionAttributes.tabooArray = dumbo;
  };
  
  answer = sessionAttributes.tabooArray;
  
  const instructMsg = `The category of this game is movies. ${pName2} cover your ears and wait for ${pName1}'s signal. <break time="1s"/>`;
    
  let whisperAnswer = `${pName1} Describe ${answer[0]} <break time="1s"/>  you are not allowed to say the following <break time="1s"/>`;
  for (let i = 0; i < sessionAttributes.maxTaboo; ++i) {
    whisperAnswer += answer[i + 1];
    if (i < sessionAttributes.maxTaboo - 1) {
      whisperAnswer += ' <break time="1s"/>';
    }
  }
  whisperAnswer += ' <break time="2s"/>';
  whisperAnswer = ApplyWhisperEffect(whisperAnswer);
  const sound = "<audio src=\"https://s3.amazonaws.com/taboohackathon/Clock_ticking.mp3\" />";
  const outro = `${pName1}, you have 10 seconds to think and say what your hint is. ` + sound;
  
  sessionAttributes.gameState = 'hint';
  sessionAttributes.turn = 0;
  
  return instructMsg + whisperAnswer + outro;
}

const StartHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    // //set game state
    // const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    // sessionAttributes.gameState = "menu";
    
    // const speechOutput = "Choose a difficulty: easy, medium or hard?";
    // const repromptOutput = "Would you like to pick easy, medium or hard?";
    console.log("In start handler, launch request");
    
    const welcome = "<audio src=\"https://s3.amazonaws.com/taboohackathon/Welcome_to_taboo.mp3\" />";
    const speechOutput = "Say 'start game' when you're ready.";
    return handlerInput.responseBuilder
      .speak(welcome + ApplyMenVoice(speechOutput))
      .reprompt(ApplyMenVoice("When you're ready, say 'start'"))
      .getResponse();
  },
};

const MenuHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'MenuIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    const pName1 = request.intent.slots.playerOneName.value;
    const pName2 = request.intent.slots.playerTwoName.value;
    const difficulty = request.intent.slots.difficulty.value;
    sessionAttributes.difficulty = difficulty;
    sessionAttributes.p1 = {name: pName1, score: 0};
    sessionAttributes.p2 = {name: pName2, score: 0};
    
    var intro = '';
    if (difficulty === 'hard') {
      sessionAttributes.maxTaboo = 5;
      intro = "<audio src=\"https://s3.amazonaws.com/taboohackathon/TO+BE+USED/hardmode+%2B+voiceline.mp3\" />";
    }
    else if (difficulty === 'medium') {
      intro = ApplyMenVoice(`You've picked ${difficulty}, get ready! `);
      sessionAttributes.maxTaboo = 4;
    }
    else {
      intro = "<audio src=\"https://s3.amazonaws.com/taboohackathon/TO+BE+USED/easy+mode.mp3\" />";
      sessionAttributes.maxTaboo = 3;
    }
    
    const REPROMPT_ROUNDS = NewRound(handlerInput);
    const MESSAGE_ROUNDS = REPROMPT_ROUNDS;

    return handlerInput.responseBuilder
      .speak(intro + ApplyMenVoice(MESSAGE_ROUNDS))
      .reprompt(ApplyMenVoice(REPROMPT_ROUNDS))
      .getResponse();
  },
};

const HintHandler = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    
    return request.type === 'IntentRequest'
      && request.intent.name === 'HintIntent'
        && sessionAttributes.gameState === 'hint';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    const hint = request.intent.slots.hintQuery.value.toLowerCase();
    
    const words = hint.split(" ");
    
    var MESSAGE_ROUNDS = '';
    let answer = sessionAttributes.tabooArray;
    let curanswer = answer.slice(0, sessionAttributes.maxTaboo);
    
    const soundTaboo = "<audio src=\"https://s3.amazonaws.com/taboohackathon/TO+BE+USED/Hint+fail+%2B+voiceline.mp3\" />";
    
    const tabooFound = words.some(r=> curanswer.indexOf(r) >= 0);
    
    if (tabooFound) {
      sessionAttributes.gameState = 'end';
      
      return handlerInput.responseBuilder
        .speak(ApplyMenVoice(soundTaboo + `You've said the taboo word which was ${answer[0]}. You lose the game. Would you like to start a new round?`))
        .reprompt(ApplyMenVoice("Start a new round?"))
        .withShouldEndSession(false)
        .getResponse();
    }
    
    MESSAGE_ROUNDS = `${sessionAttributes.p2.name}, what is your guess?`;
    sessionAttributes.gameState = 'guess';
    
    return handlerInput.responseBuilder
        .speak(ApplyMenVoice(MESSAGE_ROUNDS))
        .reprompt(ApplyMenVoice("What is your guess?"))
        .withShouldEndSession(false)
        .getResponse();
  },
};

const GuessHandler = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'GuessIntent'
        && sessionAttributes.gameState === 'guess';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    console.log('guess catched')
    const guess = request.intent.slots.guessQuery.value.toLowerCase();
    
    answer = sessionAttributes.tabooArray;
    
    const answerMatched = guess === answer[0];
    let MESSAGE_ROUNDS = '';
    
    if (answerMatched) {
      console.log()
      // say score
      sessionAttributes.p1.score += (6 - sessionAttributes.turn)*2;
      sessionAttributes.p2.score += (6 - sessionAttributes.turn);
      const win = "<audio src=\"https://s3.amazonaws.com/taboohackathon/TO+BE+USED/Win+%2B+voiceline.mp3\" />";
      // new round?
      MESSAGE_ROUNDS = win + ` ${sessionAttributes.p1.name}'s current score is ' ${sessionAttributes.p1.score}! ${sessionAttributes.p2.name}'s current score is ' ${sessionAttributes.p2.score}! Would you like to start a new round?`;
      sessionAttributes.gameState = 'end';
      return handlerInput.responseBuilder
        .speak(ApplyMenVoice(MESSAGE_ROUNDS))
        .reprompt(ApplyMenVoice("Start a new round?"))
        .withShouldEndSession(false)
        .getResponse();
    }
    
    sessionAttributes.turn += 1;
    
    if(sessionAttributes.turn >= 5) {
      MESSAGE_ROUNDS = `You have used up five tries. The word to guess was ${answer[0]}. Noone got any points. Start a new round?`
      sessionAttributes.gameState = 'end';
      return handlerInput.responseBuilder
        .speak(ApplyMenVoice(MESSAGE_ROUNDS))
        .reprompt(ApplyMenVoice("Start a new round?"))
        .withShouldEndSession(false)
        .getResponse();
    }
    
    const sound = "<audio src=\"https://s3.amazonaws.com/taboohackathon/Clock_ticking.mp3\" />";
    const wrong = "<audio src=\"https://s3.amazonaws.com/taboohackathon/TO+BE+USED/Loser+%2B+voiceline.mp3\" />";

    MESSAGE_ROUNDS = wrong + `${sessionAttributes.p1.name}, prepare to give another hint. You have 10 seconds to think.` + sound;
    sessionAttributes.gameState = 'hint';
    
    
    return handlerInput.responseBuilder
      .speak(ApplyMenVoice(MESSAGE_ROUNDS))
      .reprompt(ApplyMenVoice(`${sessionAttributes.p1.name}, what is your hint?`))
      .withShouldEndSession(false)
      .getResponse();
  },
};

const YesHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.YesIntent'
        && sessionAttributes.gameState === 'end';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    const temp = sessionAttributes.p1;
    sessionAttributes.p1 = sessionAttributes.p2;
    sessionAttributes.p2 = temp;
    
    const RESTART_MESSAGE = NewRound(handlerInput);
    
    return handlerInput.responseBuilder
      .speak(ApplyMenVoice(RESTART_MESSAGE))
      .reprompt(ApplyMenVoice(RESTART_MESSAGE))
      .withShouldEndSession(false)
      .getResponse();
  }
}


const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(ApplyMenVoice(HELP_MESSAGE))
      .reprompt(ApplyMenVoice(HELP_REPROMPT))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return request.type === 'IntentRequest'
      && ((request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent')
          || (request.intent.name === 'AMAZON.NoIntent'
            && sessionAttributes.gameState === 'end'));
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(ApplyMenVoice(STOP_MESSAGE))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    let HELP_MESSAGE = 'Unknown Problem. Sorry.';
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    if(sessionAttributes.gameState === 'hint'){
      HELP_MESSAGE = "Please say 'hint is' or 'my hint is' before giving a hint";
    }

    return handlerInput.responseBuilder
      .speak(ApplyMenVoice(HELP_MESSAGE))
      .reprompt(ApplyMenVoice(HELP_MESSAGE))
      .getResponse();
  },
};

const SKILL_NAME = 'Space Facts';
const GET_FACT_MESSAGE = 'Here\'s your fact: ';
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Thanks for playing. Goodbye!';


var answer;

const aladdin = [
  'aladdin',
  'jasmine',
  'genie',
  'lamp',
  'carpet',
  'wish'
];

const dumbo = [
  'dumbo',
  'elephant',
  'flying',
  'circus',
  'disney',
  'timothy'
];

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    JamesHandler.NumRoundsHandler,
    MenuHandler,
    HintHandler,
    GuessHandler,
    StartHandler,
    YesHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
