/*

 Usage

 1. include jQuery

 2. initialize the Whack_a_mole object

 Example:

 <script type="text/javascript">
 $( document ).ready(function() {
    var myConfig = {
        target: "#grid"
     }

    Whack_a_mole.init(myConfig);
 });
 </script>

 */

// Object oriented JavaScript
// using event delegation for handling user actions
// using closures to control variable scope
var Whack_a_mole = (function() {

    // private variables and functions
    var defaultConfig = {
            target: 'body', // DOM element selector to use as "whack-a-mole" container
            hole_html: '<div class="hole"></div>',
            mole_html: '<div class="mole"></div>',
            holes_number: 5,
            rounds_number: 10,
            mole_up_time: 1200, // milliseconds
            round_time: 1600 // milliseconds
        };
    var config = {};
    var privatePlayHtml$ = $('<div class="play"><button type="button">Play</button></div>');
    var privateDisplayHtml$ = $('<div class="display"></div>');
    var privateGridWrapper$ = $('<div class="grid-wrapper"></div>');
    var result = 0;
    var holes = [];
    var running = false;
    var countdownSpeed = 500;
    var timer;

    // Return a random integer between min (included) and max (excluded)
    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }


    // use console.log() if exists
    var log = function(str) {
        if(window.console){
            console.log(str);
        }
    }

    var init = function( settings ) {

        // reset object with a new init
        reset();

        // allow overriding the default config
        // Merge defaultConfig and settings, without modifying defaultConfig
        config = $.extend( {}, defaultConfig, settings );

        // if target is body, create a DOM element as target (to be free to remove the target)
        if (config.target == 'body') {

            // create an identifier with the current time in milliseconds
            var targetid = new Date().getTime();

            // assign the target selector
            config.target = "#" + targetid;

            // append the DOM for the target to body element
            $("body").append('<div id="' + targetid + '"></div>');

        }

        // enforce reasonable settings
        config.holes_number = Math.max(1, config.holes_number); // at least 1 hole
        config.rounds_number = Math.max(1, config.rounds_number); // at least 1 round
        config.round_time = Math.max(500, config.round_time); // at least 0.5 seconds per round
        config.mole_up_time = Math.min(config.mole_up_time, config.round_time - 200); // mole sink back at least 200ms before the next round start

        // create holes object
        for(var index = 0; index < config.holes_number; index++ ) {
            holes[index] = new Hole(index);
        }

        // draw the user interface
        drawUserInterface();

        // event delegation for handling user actions
        eventDelegation();
    };

    var reset = function(){
        if (config.target) {

            // remove event handlers
            $(config.target).off();

            // remove DOM elements to build the grid from scratch
            $(config.target).empty();
            privateGridWrapper$.empty();

            // empty holes array (bye bye to all Hole instances and Mole instances, thanks to garbage collection)
            holes = [];

        }
    }

    // draw the user interface
    var drawUserInterface = function() {

        // (simply arrange the holes on the screen filling a square)
        // find the side of the minimum square grid that can contain the holes
        var square_side = Math.ceil(Math.sqrt(holes.length));

        // append DOM for holes and moles inside "grid-wrapper" container
        for (var i = 0; i < holes.length; i++){

            // starting from second hole, add new line if my "row" has enough holes
            if ( i>0 && (i % square_side)==0)  {
                privateGridWrapper$.append('<br>');
            }

            privateGridWrapper$.append(holes[i].getHtml$());
        }

        // store data to DOM element for event delegation
        privatePlayHtml$.find("button").data("type","play");

        // append play button to the "whack-a-mole" container
        $(config.target).append(privatePlayHtml$);

        // append display (where score will be shown) to the "whack-a-mole" container
        $(config.target).append(privateDisplayHtml$);

        // append grid-wrapper to the "whack-a-mole" container
        $(config.target).append(privateGridWrapper$);

    };

    // event delegation for handling user actions
    var eventDelegation = function() {

        // attach event handlers to "whack-a-mole" chosen container
        $(config.target).on("click countdown_end",function(event){

            var action = '';

            // choose action based on event.type
            switch (event.type) {

                // click events
                case "click":
                    // check the data attached to the target
                    // example: type "mole" and id "0" represents the mole in the first hole
                    action = $(event.target).data("type");
                    var id = $(event.target).data("id");
                    break;

                // "countdown_end" events
                case "countdown_end":
                default:
                    // use event.type as default action
                    action = event.type;

            }


            // actions to be performed
            switch(action) {

                // a mole was clicked, whack it!
                case "mole":
                    // stop unnecessary propagation
                    event.stopPropagation();

                    // get the clicked mole from the right hole and whack it
                    holes[id].getMole().whack();

                    break;

                // the "play" button was clicked
                case "play":
                    // stop unnecessary propagation
                    event.stopPropagation();




                    // if "wack-a-mole" is not running, start it
                    if (!running) {

                        // reset the result
                        result = 0;

                        // reset the display
                        display("");

                        // keep track of the running status
                        running = true;

                        // disable play button while the game is running
                        playButtonEnableDisable(false);

                        // start countdown to raise an event to start moving the moles
                        countdown();
                    }

                    break;

                // the "countdown_end" event was raised, it's time to start to play!
                case "countdown_end":
                    // stop unnecessary propagation
                    event.stopPropagation();

                    // start
                    startMoles();
                    break;
                default:
                    //
            }
        });


    };

    // show message on display
    var display = function(str) {
        privateDisplayHtml$.html(str);
    };

    // show animation of clicked mole and update partial result
    var displayPartial = function(clickedMole, partialResult){
        // get position of the clicked mole (initial position)
        var moleOffset = clickedMole.getOffset();

        // get position of the display (final position)
        var displayOffset = privateDisplayHtml$.offset();

        // creates DOM elements on the fly: http://api.jquery.com/jQuery/#jQuery2
        // add the "clicked" class to show the image "mole-clicked.png"
        // assign the width (the same of the clicked mole)
        // assign the height (the same of the clicked mole)
        // append the clicked mole to the HTML body (show it)
        // assign the initial offset (the same of the clicked mole)

        var clickedMole$ =  $(config.mole_html)
                            .addClass("clicked")
                            .width(clickedMole.getHtml$().width())
                            .height(clickedMole.getHtml$().height())
                            .appendTo("body")
                            .offset(moleOffset);

        // after 250 milliseconds (so we can see the clicked mole)
        // move clicked mole to the score and remove it from DOM
        // update the partial result on display
        window.setTimeout(function(){
            clickedMole$.animate({
                opacity: 0,
                left: displayOffset.left,
                top: displayOffset.top
            }, 1000, function(){
                // display partial value only if the game is running
                if (running) {
                    display('<div class="partial">Score: ' + partialResult + ' <img src="assets/images/mole-clicked.png"></div>');
                }
                //this.remove();
            })},250);






    };


    // show countdown to prepare the player
    var countdown = function(){

        // strings for countdown
        var arrText = ["Ready?","3...","2...","1...","Go!"];

        // show first string for countdown
        var i = 0;
        display(arrText[i++]);

        // show next strings for countdown with 1 second interval
        var countdown = setInterval(function(){
            // display next string (if present)
            if (i < arrText.length) {
                display(arrText[i++]);

            } else { // all strings were displayed

                // stop the interval
                clearInterval(countdown);

                // trig "countdown_end" event for event delegation
                $(config.target).triggerHandler("countdown_end");

            }
        }, countdownSpeed);
    };

    // start to move the moles, round by round
    var startMoles = function(){

        // display partial score (should be 0)
        display('<div class="partial">Score: ' + result + "</div>");

        var tick = 0;

        function whack_round(){
            if (tick < config.rounds_number) {
                tick++;
                log("Round: "+ tick);

                // choose how many moles to pop up
                var n_ready_moles = getRandomInt(1, config.holes_number + 1);

                // pool of holes' indexes for reference "holes" array
                var holes_indexes_pool = [];
                for(var i=0; i < holes.length; i++) {
                    holes_indexes_pool.push(i);
                }

                // pick random holes' indexes for moles to pop up
                for(var i = 0; i < n_ready_moles; i++) {
                    var random_hole_index = getRandomInt(0, holes_indexes_pool.length);
                    // remove the chosen hole's index from the pool
                    var hole_index = holes_indexes_pool.splice(random_hole_index, 1);
                    holes[hole_index].getMole().goUp();
                }

                // after "config.mole_up_time" milliseconds, hide all moles
                var timerdown = window.setTimeout(function() {
                    for (var i in holes) {
                        holes[i].getMole().goDown();
                    }
                }, config.mole_up_time);

                // set next round in "config.round_time" milliseconds
                var timer = window.setTimeout(whack_round, config.round_time);
            } else {
                endGame();
            }
        };

        // start first round, the function will use setTimeout to call itself for the next round
        // I choose the "setTimeout" approach, instead of setInterval to eventually accelerate the velocity of the game
        whack_round();
    };

    // end the game and show final result
    var endGame = function() {
        // keep track of the end of the running status
        running = false;

        // reset display
        display('');

        log("Game over");

        showResult();

        // enable play button
        playButtonEnableDisable(true);
    };

    // show the final result with a special
    var showResult = function(){

        var strResult = "Final result: " + result + " mole" + ((result>1)?"s":"");

        // wrap in span to control the final special effect
        display("<span>" + strResult + "</span>");

        // a little special effect for the end of the game
        privateDisplayHtml$.find('span').animate({'font-size':'2em'}, 200).animate({'font-size':'0.7em'}, 200).animate({'font-size':'1.2em'}, 300);

        log(strResult);
    };

    // Hole constructor
    var Hole = function(index) {
        var index = index;

        // creates DOM elements on the fly: http://api.jquery.com/jQuery/#jQuery2
        var html$ = $(config.hole_html);

        // every hole hosts a mole
        var mole = new Mole(index);

        // insert mole's DOM elements inside hole's DOM elements
        html$.append(mole.getHtml$());

        // html$ getter
        this.getHtml$ = function(){
            return html$;
        }

        // mole getter
        this.getMole = function(){
            return mole;
        }

    };

    // Mole constructor
    var Mole = function(index){
        var index = index;

        // a new mole is always down
        var up = false;

        // creates DOM elements on the fly: http://api.jquery.com/jQuery/#jQuery2
        var html$ = $(config.mole_html);

        // store data to DOM element for event delegation
        html$.data( {type: 'mole', id: index} );

        //var up_time = conf.up_time;

        this.goUp = function(){
            up = true;
            html$.addClass("up");
        };

        this.goDown = function(){
            up = false;
            html$.removeClass("up");
        };

        this.whack = function(){
            result++;
            this.goDown();

            // start animation of clicked mole to show partial result
            displayPartial(this, result);
        };

        // html$ getter
        this.getHtml$ = function(){
            return html$;
        }

        // get position of the html$
        this.getOffset = function(){
            return html$.offset();
        };

        // up getter
        this.isUp = function(){
            return up;
        }
    };

    // enable (boo===true) or disable (boo===false) the Play button
    var playButtonEnableDisable = function(boo){
        if (boo == true) {
            // enable only if game is not running
            if (!running) {
                privatePlayHtml$.find("button").prop("disabled", false);
            }
        } else if (boo == false) {
            privatePlayHtml$.find("button").prop("disabled", true);
        }
    }

    // getter for running variable
    var isRunning = function() {
        return running;
    }

    // getter for default config
    var getDefaultConfig = function() {
        return defaultConfig;
    }

    // everything is private until here
    // explicitly return the public API to interact with this object
    return {
        init: init,
        playButtonEnableDisable: playButtonEnableDisable,
        isRunning: isRunning,
        getDefaultConfig: getDefaultConfig,
        display: display
    };

})();


