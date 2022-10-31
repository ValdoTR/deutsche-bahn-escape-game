/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ',WA.player.tags)


    /*
        WA.nav.goToRoom("map.json#step2")
        const x = 150*32
        const y = 16*32
        WA.camera.set(x, y, 500, 500, false, true)
    */

    const clueWarning = "Asking for a clue will add 2 minutes to your time. The game ends after 20 minutes."
    let riddleCigaretteCompleted = false // TODO State variable
    let riddleQuestionCompleted = false

    let cigaretteFound = false
    let questionOngoing = false

    WA.room.area.onEnter("cigarette").subscribe(() => {
        currentPopup = WA.ui.openPopup("cigarettePopup", "A cigarette left on the ground. There is a trash can for that, but this person was obviously in a hurry.", [])
        cigaretteFound = true
    })
    WA.room.area.onLeave("cigarette").subscribe(closePopup)

    WA.room.area.onEnter("cigaretteThrown").subscribe(() => {
        if (cigaretteFound) {
            currentPopup = WA.ui.openPopup("cigaretteThrownPopup", "You throw the cigarette in the garbage can. You completed a riddle.", [])
            riddleCigaretteCompleted = true
        }
    })
    WA.room.area.onLeave("cigaretteThrown").subscribe(closePopup)

    WA.room.area.onEnter("info").subscribe(() => {
        currentPopup = WA.ui.openPopup("infoPopup", "The goal is to enter all together in the train n°1 and to start it in order to escape!\nThe door can only be opened by the robot in front of the door if you complete all the riddles.", [])
    })
    WA.room.area.onLeave("info").subscribe(closePopup)

    WA.room.area.onEnter("game").subscribe(() => {
        currentPopup = WA.ui.openPopup("gamePopup", "I'm playing Tic-tac-toe but I'm tired of playing against this robot. Can you try to win the game with circles?", [])
        WA.state.TicTacToeStarted = true
    })
    WA.room.area.onLeave("game").subscribe(closePopup)

    WA.room.onEnterLayer("tic-tac-toe").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToeOngoing = true
        }
    })

    WA.room.onEnterLayer("tic-tac-toe-play1").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToePlay1 = true
            WA.state.TicTacToeWon = WA.state.TicTacToePlay2
        }
    })
    WA.room.onLeaveLayer("tic-tac-toe-play1").subscribe(() => {
        WA.state.TicTacToePlay1 = false
    })

    WA.room.onEnterLayer("tic-tac-toe-play2").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToePlay2 = true
            WA.state.TicTacToeWon = WA.state.TicTacToePlay1
        }
    })
    WA.room.onLeaveLayer("tic-tac-toe-play2").subscribe(() => {
        WA.state.TicTacToePlay2 = false
    })    

    WA.chat.onChatMessage((message => {
        if (questionOngoing) {
            riddleQuestionCompleted = message == "2018"
            if (riddleQuestionCompleted) {
                WA.chat.sendChatMessage("Correct. You can now enter.", "KindRobot000")
                WA.room.hideLayer("room1bot")
                WA.state.trainDoor = true
            } else {
                WA.chat.sendChatMessage("Incorrect. You now have to start all over again.", "KindRobot000")
                questionOngoing = false
            }
        }
    }));

    WA.room.area.onEnter("room1bot").subscribe(() => {
        if (WA.state.TicTacToeWon && riddleCigaretteCompleted) {
            WA.chat.sendChatMessage("Stranger, can you tell me in what year the train track switches were fully automated? Type your answer here.", "KindRobot000")
            WA.chat.sendChatMessage("Think carefully! If you make a mistake you will have to start all over again", "KindRobot000")
            questionOngoing = true
        } else {
            currentPopup = WA.ui.openPopup("room1botPopup", "Stranger, I'll block the access to this train until you prove your worth. " + clueWarning, [
                {
                    label: 'Give me a clue',
                    className: 'primary',
                    callback: () => giveClue(0),
                }
            ])
        }
    })
    WA.room.area.onLeave("room1bot").subscribe(closePopup)

    WA.room.area.onEnter("room2bot").subscribe(() => {
        currentPopup = WA.ui.openPopup("room2botPopup", "Stranger, it seems this train is not going to start until you find the right key. " + clueWarning, [
            {
                label: 'Give me a clue',
                className: 'primary',
                callback: () => giveClue(1),
            }
        ])
    })
    WA.room.area.onLeave("room2bot").subscribe(closePopup)

    WA.room.area.onEnter("room3bot").subscribe(() => {
        currentPopup = WA.ui.openPopup("room3botPopup", "Stranger, it seems your beloved Max Maulwurf is hangry. You will be blocked here until you comfort him. " + clueWarning, [
            {
                label: 'Give me a clue',
                className: 'primary',
                callback: () => giveClue(2),
            }
        ])
    })
    WA.room.area.onLeave("room3bot").subscribe(closePopup)

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

const clues = [
    [ "Message from the  Scripting API", "1: Indice 2", "1: Indice 3" ],
    [ "2: Indice 1", "2: Indice 2", "2: Indice 3" ],
    [ "3: Indice 1", "3: Indice 2", "3: Indice 3" ]
  ]
let tries = 0

function giveClue(room: number){
    if (clues[room][tries]) {
        WA.chat.sendChatMessage(clues[room][tries], "KindRobot00"+room)
        tries ++
    } else {
        WA.chat.sendChatMessage("Sorry. No more clues for this room.", "KindRobot00"+room)
    }
    
}

export {};
