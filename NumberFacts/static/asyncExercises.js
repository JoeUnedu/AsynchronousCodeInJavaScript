/*
    NUMBERS API RELATED FUNCTIONS
*/

const API_ROOT = 'http://numbersapi.com/';
const API_CONFIG = {
    headers: { "Content-Type": "application/json" }
}

async function callNumbersAPI(favNbr, nbrOfFacts, fx) {

    /*
        Call the numbers api at http://numbersapi.com/favNbr
        for trivia about the number(s) in favNbr. Multiple numbers
        are possible for favNbr as long as they are separated by
        a comma. 

        nbrOfFacts is the number of facts to return for the number.
        When multiple numbers are in favNbr, nbrOfFacts must be 1. 
        
        The function that is calling callNumbersAPI (this function) 
        must ensure that there are no spaces in favNbr -- only digits
        and commas -- and that nbrOfacts is 1 when more than one 
        number is in favNbr.

        fx is the name of the function that processes the 
        results returned from the api.

    */

    const nbrFacts = []

    for (let i = 0; i < nbrOfFacts; i++) {
        nbrFacts.push(axios.get(`${API_ROOT}${favNbr}`, API_CONFIG));
    }

    try {
        const response = await Promise.all(nbrFacts);

        // We will get nbrFact data responses back. Only check the status
        //  for the first one in the response data array.
        if (response[0].status === 200) {
            if (response.length == 1) {
                fx(response[0].data, "success");
            } else {
                fx(response, "success-m");
            }

        } else {
            fx(response, "error");
        }
    }
    catch (error) {
        fx(error, "error");
    }

}


/* setFavNbrFormFields will handle populating the form with number data from the api call.
   Form messaging and error fields are cleared when data is ''.
*/

function setFavNbrFormFields(data, type) {

    if (data) {

        if (type === "success") {
            // data['data'] can have 1:M values. When there is 1 value, 'data' is the key.
            // When there are multiple values, the entered number is the key.

            let msg;

            if (typeof (data) === "string") {
                msg = `${data}`;

            } else {
                msg = '';
                let delim = '';
                for (let key in data) {
                    msg = `${msg}${delim}${data[key]}`;
                    delim = "<br>";
                }
            }

            $("#favnbr-trivia").html(`<br>${msg}<br><br>`);

        } else {

            if (type === "success-m") {
                // data is an array of {data: fact} objects. Handle each one.
                let msg = '';
                data.forEach((fact, idx) => {
                    msg = `${msg}Fact #${idx + 1}: ${fact["data"]}<br>`;
                })

                $("#favnbr-trivia").html(`<br>${msg}<br>`);

            } else {
                // we have an error. Put data in the field's error.
                $("#fav-nbr-err").text(data);
            }

        }

    } else {
        // Clear the trivia message and error messages.
        $("#favnbr-trivia").html("<br><br><br>");
        $("#fav-nbr-err").text("");
        $("#nbr-of-facts-err").text("");

    }

}


function processFavNbrForm(evt) {

    evt.preventDefault();

    // Clear the form fields
    setFavNbrFormFields('', '');

    let favNbr = ($("#fav-nbr").val().trim()).replaceAll(' ', '');
    if (favNbr.length > 0) {
        nbrOfFacts = 1 * ($("#nbr-of-facts").val());

        if (nbrOfFacts > 1) {
            // make sure there is only one number in favNbr.
            if (favNbr.indexOf(",") > -1) {
                $("#nbr-of-facts-err").text(`Ignored ${nbrOfFacts} - Multiple facts are not available for mulitiple numbers.`);
                callNumbersAPI(favNbr, 1, setFavNbrFormFields);
            } else {
                callNumbersAPI(favNbr, nbrOfFacts, setFavNbrFormFields);
            }
        } else {
            callNumbersAPI(favNbr, 1, setFavNbrFormFields);
        }

    } else {
        // Value is needed for fav nbr.
        $("#fav-nbr-err").text("'Favorite Number' cannot be all spaces.");
    }

}


$("#favnbr-form").on("submit", processFavNbrForm);

