/*
 User code

 I imagined a user using "whack-a-mole" object in a site

 For example: the user is adding an interface to change the "holes" and "rounds" settings

*/
$( document ).ready(function() {

    // preload moles images with ajax
    $.get("assets/images/mole.png");
    $.get("assets/images/mole-clicked.png");

    // update display with my configurator values
    var updateDisplay = function() {
        // get values from configurator input fields
        var holes = $("#holes_number").val();
        var rounds = $("#rounds_number").val();

        // build string adding 's' (plural) if values > 1
        var str = holes + " hole" + ((holes>1)?"s":"");
        str += ", " + rounds + " round" + ((rounds>1)?"s":"");

        Whack_a_mole.display(str);
    };

    // labels for switch
    var switch_label = ["Hide settings and play", "Show settings"];

    // fill selects for configure 'holes_number' and 'rounds_number' with 1, 2, ..., 100
    $.each(['holes_number','rounds_number'], function(key, value) {
        for(var i=1; i<=100; i++) {
            $('#'+value).append($("<option/>", {
                value: i,
                text: i
            }));
        }
    });

    var myConfig = {
        target: "#grid",
        holes_number: 5,
        rounds_number: 10,
        mole_up_time: 1200, // milliseconds
        round_time: 1600 // milliseconds
    }

    // update configurator with my default values
    $("#holes_number").val(myConfig.holes_number);
    $("#rounds_number").val(myConfig.rounds_number);

    Whack_a_mole.init(myConfig);

    // update display with my configurator values
    updateDisplay();


    // event delegation
    $(document).on("click change", function(event) {

        // use element id as action
        var action = $(event.target).attr('id');

        switch(action) {
            // switch configurator
            case "switch":
                event.stopPropagation();
                event.preventDefault();

                // proceed only if the event is a click and the game is not running
                if (event.type == "click" && !Whack_a_mole.isRunning()) {

                    // check if configurator is hidden
                    var visible = ( $(".configurator").is(":hidden") ) ? 0 : 1 ;

                    // we are going to switch the configurator's visibility, set the right label
                    $("#switch").html( switch_label[ visible ] );

                    // if configurator is not visible we are going to open it
                    if (visible == 0) {
                        // disable play button, to avoid to play during configuration
                        Whack_a_mole.playButtonEnableDisable(false);
                        // open configurator
                        $(".configurator").slideDown();

                    } else { // if configurator is visible we are going to close it

                        // close configurator
                        $(".configurator").slideUp(function(){
                            // when is closed, enable play button
                            Whack_a_mole.playButtonEnableDisable(true);
                        });
                    }
                }
                break;

            // configuration modified
            case "holes_number":
            case "rounds_number":

                // proceed only if the event is a change and the game is not running
                if (event.type == "change" && !Whack_a_mole.isRunning()) {

                    // read new settings from configurator's input
                    var newSettings = {
                        holes_number: parseInt($("#holes_number").val()),
                        rounds_number: parseInt($("#rounds_number").val())
                    };

                    // Merge myConfig and newSettings, without modifying myConfig
                    newSettings = $.extend( {}, myConfig, newSettings );

                    // init Whack_a_mole with the new settings
                    Whack_a_mole.init(newSettings);

                    // update display with my configurator values
                    updateDisplay();

                }
                break;
            default:
            // nothing caught
        }



    });

});
