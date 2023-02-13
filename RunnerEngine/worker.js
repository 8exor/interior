import myEvents from './Emitter.js';

// Interval Runner for Running Interval at every Exact 1 Minute //
function setOneSecondInterval()
{
    var D = new Date();
    D.setUTCSeconds(D.getUTCSeconds() + 1 , 0);
    var SecondAhead = D.getTime();

    setTimeout(OneSecondInterval, (SecondAhead - Date.now()));

}

function setOneMinuteInterval()
{
    var D = new Date();
    D.setUTCMinutes(D.getUTCMinutes() + 1 , 0 , 0);
    var MinuteAhead = D.getTime();

    setTimeout(OneMinuteInterval, (MinuteAhead - Date.now()));

}

let OneSecond;
let OneMinute;

const OneSecondInterval = () => {
    OneSecond = setInterval(function(){
        console.log('Seconds At' ,new Date().getUTCSeconds());
        // Hit One Second Event
        myEvents.emit('one_second');
    } , 1000);
}

const OneMinuteInterval = () => {
    OneMinute = setInterval(function(){
        console.log('Minutes At' ,new Date().getUTCMinutes());
        // Hit One Minute Event
        myEvents.emit('one_minute');
    } , 60000);
};

const stopSecondInterval = () => clearInterval(OneSecond);
const stopMinuteInterval = () => clearInterval(OneMinute);

export default {
    setOneSecondInterval,
    setOneMinuteInterval,
    stopSecondInterval,
    stopMinuteInterval
} ;

// Event Listeners //