/*
    DECK OF CARDS API RELATED FUNCTIONS
*/


let runaway = 0;
let deck;

class DeckOfCards {

    constructor(deck_id) {
        this.LOCAL_STORAGE_ITEM = "deckOfCards";
        this.deckId = this.getLocalStorage(deck_id);
        this.API_ROOT = 'https://deckofcardsapi.com/api/deck/';
    }


    getLocalStorage(defaultVal) {

        // retrieve the deck id, if any, from localStorage so we always 
        //  use that deck instead of a new deck everytime the application
        //  runs. The poor API developer must think holy crap, look at all
        //  these people using my API when it is really a handful of 
        //  people using a deck once as they test their code!
        const tempVal = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_ITEM));

        let outVal = defaultVal;

        if (tempVal) {
            // truthty value, tempVal is not null or undefined. Use tempVal
            if (tempVal.length > 0) {
                outVal = tempVal;
            }
        }

        return outVal
    }


    // setLocalStorage sets key LOCAL_STORAGE_ITEM to the deck id in use.
    // The goal is to recycle and reuse!
    setLocalStorage(inObject) {

        localStorage.setItem(this.LOCAL_STORAGE_ITEM, JSON.stringify(inObject));

    }

    getDeckId() {
        return this.deckId;
    }

    // shuffle the deck
    async shuffle() {

        try {
            const response = await axios.get(`${this.API_ROOT}${this.deckId}/shuffle`,
                {
                    validateStatus: function (status) {
                        // Resolve when the status code is less than 500
                        return status < 500;
                    }
                }
            );

            if (response.data.success) {
                if (this.deckId === "new") {
                    // this is a new deck that was shuffled. Save the 
                    //  deck id to local storage
                    this.deckId = response.data.deck_id;
                    this.setLocalStorage(response.data.deck_id);
                }
                return { "success": true };
            } else {
                // check for bad deck id.
                if (response.data.error.indexOf("does not exist") > -1) {
                    if (this.deckId === "new") {
                        // shuffle of a new deck has failed. There is no
                        //  need to call getNewShuffledDeck because the
                        //  deck WAS "new".
                        return {
                            "success": false,
                            "error": "The shuffle of a new deck failed."
                        };
                    } else {
                        // failure most likely due to bad / invalid / expired deck id.
                        // Get a new, shuffled deck.
                        status = await this.getNewShuffledDeck()
                        // The error message is set just in case getNewShuffledDeck() 
                        //  returned false.
                        return {
                            "success": status,
                            "error": `Deck Id ${this.deckId} was not found and the shuffle of a new deck failed. `
                        };
                    }
                } else {
                    return {
                        "success": false,
                        "error": `An quasi-unexpected error, '${response.data.error}' occurred.`
                    };
                }
            }
        }
        catch (error) {
            return {
                "success": false,
                "error": `An unexpected error, '${error}' occurred.`
            };
        }

    }


    // shuffle a new deck
    async getNewShuffledDeck() {

        // this is an internal function. We had a deck id that failed a shuffle.
        // Get a new shuffled deck and update this.deckId to the new deck.
        try {
            const response = await axios.get(`${this.API_ROOT}new/shuffle`);

            if (response.data.success) {
                this.deckId = response.data.deck_id;
                this.setLocalStorage(response.data.deck_id);
                return true;
            } else {
                // we used the deck id in a shuffle and it failed. 
                // We got and shuffled a new deck, and that failed too.
                // for now, clear this.deckId
                this.deckId = "";
                return false
            }
        }
        catch (error) {
            return false;
        }
    }


    // deal nbrOfCards
    async dealCards(nbrOfCards) {

        try {
            const response = await axios.get(`${this.API_ROOT}${this.deckId}/draw/?count=${nbrOfCards}`,
                {
                    validateStatus: function (status) {
                        // Resolve when the status code is less than 500
                        return status < 500;
                    }
                }
            );

            if (response.data.success) {

                return {
                    "cards": response.data.cards,
                    "remaining": response.data.remaining,
                    "success": true
                }

            } else {

                return {
                    "success": false,
                    "data": response.data
                }
            }
        }
        catch (error) {
            return {
                "success": false,
                "data": `ERROR: ${error}`
            }
        }

    }

}


async function dealCard(evt) {

    evt.preventDefault();

    let msg = $("#msg").text();

    response = await deck.dealCards(1);
    if (response.success) {
        runaway = 0;
        $("#card").attr("src", response["cards"][0]["image"])

        if (response["remaining"] > 1) {
            $("#cards-remaining").text(`${response["remaining"]} cards remaining`);
        } else {
            if (response["remaining"] === 1) {
                $("#cards-remaining").text(`${response["remaining"]} card remains`);
            } else {
                $("#deal-card").prop("disabled", true)
                $("#cards-remaining").text(`0 cards remaining in deck# ${deck.getDeckId()}. `);
                $("#msg").text("No More Cards");
            }
        }

    } else {
        // was it a status code 500? They happen sometimes. 
        if (response.data.indexOf("status code 500") > -1) {
            // This is 'technically' an endless loop if 'status code 500' keeps 
            //  coming back on consecutive calls. runaway will stop calling 
            //  dealCard (this function) when 3 consecutive calls results in
            //  '...status code 500'. Happily, I found this without getting stuck
            //  in a loop (plus the 500s are spiratic)
            if (runaway < 3) {
                runaway++;
                // yes, status 500, but we are executing ok. 
                dealCard(evt);
            }

        } else {
            $("#msg").text(`${msg}${response.data} `);
        }
    }

}


// waits for the DOM to load
$(async function () {

    // Once the DOM is loaded, instantiate 'deck'. The deck id "new" is the default to 
    //  use when a deck id was not found in local storage. 
    // The DeckOfCards class handles invalid / expired decks by getting a 
    //  new deck id and saving the deck id to local storage when it successfully
    //  shuffles.

    deck = new DeckOfCards("new")

    // shuffle the deck. Something went wrong with the deck and api calls when false is
    //  returned. 
    results = await deck.shuffle();
    if (results.success) {
        // a deck from localStorage was successfully shuffled OR
        //  a new deck was obtained and successfully shuffled.
        // add the click event to the deal-card button.
        $("#msg").text(`Deck Id ${deck.getDeckId()}: `);
        $("#deal-card").on("click", dealCard);
    } else {
        $("#deal-card").prop("disabled", true)
        $("#msg").text(`${results.error}`);
    }

});
