EventAnalytics = {};
EventAnalytics.mscroll = EventAnalytics.mscroll || {};

EventAnalytics.mscroll.ts = {};
EventAnalytics.mscroll.ts.compile = new Date().getTime();
EventAnalytics.mscroll.ts.load = 0;
EventAnalytics.mscroll.ts.lastscroll = 0;
EventAnalytics.mscroll.ts.lastpause = 0;

EventAnalytics.mscroll.timeonpage = 0;
EventAnalytics.mscroll.pausetime = 0;
EventAnalytics.mscroll.pausenumber = 0;

EventAnalytics.mscroll.scroll = {};
EventAnalytics.mscroll.scroll.steps = {};
EventAnalytics.mscroll.scroll.actualscroll = 0;
EventAnalytics.mscroll.scroll.lastscroll = 0;
EventAnalytics.mscroll.scroll.lowreslastscroll = 0;
EventAnalytics.mscroll.scroll.maxscroll = 0;
EventAnalytics.mscroll.scroll.history = [];

EventAnalytics.mscroll.Init = function(){
    EventAnalytics.mscroll.ts.load = new Date().getTime();
    EventAnalytics.mscroll.ts.lastpause = EventAnalytics.mscroll.ts.load;
    EventAnalytics.mscroll.scroll.maxscroll = $(document).height() - $(window).height();
    setInterval( EventAnalytics.mscroll.UpdateLocalData, 150 );
    setInterval( EventAnalytics.mscroll.UpdateLowResScroll, 550 );
    EventAnalytics.mscroll.InitScrollSteps();
    $( window ).scroll(function() {
        EventAnalytics.mscroll.UpdateScrollValues();
        EventAnalytics.mscroll.SetScrollTimer();
    });
};

EventAnalytics.mscroll.InitScrollSteps = function(){
    for(var i = 10; i>-1; i--){
        EventAnalytics.mscroll.scroll.steps[i*10] = false;
    }
}

EventAnalytics.mscroll.UpdateLocalData = function(){
    var deltaTime = ((new Date().getTime() - EventAnalytics.mscroll.ts.load)/1000).toFixed(1);
    EventAnalytics.mscroll.timeonpage = parseFloat(deltaTime);
    EventAnalytics.mscroll.scroll.lastscroll = $( window ).scrollTop();
}

EventAnalytics.mscroll.UpdateLowResScroll = function(){
    EventAnalytics.mscroll.scroll.lowreslastscroll = $( window ).scrollTop();
}

EventAnalytics.mscroll.FirePause = function(){
    var localts = new Date().getTime();
    //console.log("Paused Scroll");
    var LastPauseDur = ((localts-EventAnalytics.mscroll.ts.lastpause)/1000).toFixed(1);
    //console.log("Last pause to action time "+LastPauseDur+"seconds");
    EventAnalytics.mscroll.ts.lastpause = localts;
    EventAnalytics.mscroll.pausetime += parseFloat(LastPauseDur);
    EventAnalytics.mscroll.pausenumber++;
}

EventAnalytics.mscroll.SetScrollTimer = function(){
    if( window.mytimer ){
        clearTimeout( window.mytimer );
    }
    window.mytimer = setTimeout(EventAnalytics.mscroll.FirePause, 300);
}

EventAnalytics.mscroll.UpdateScrollValues = function(){
    EventAnalytics.mscroll.scroll.actualscroll = $( window ).scrollTop();
    EventAnalytics.mscroll.ts.lastscroll = new Date().getTime();

    if( EventAnalytics.mscroll.IsScrollDown() ){
        EventAnalytics.mscroll.AddScrollHistory("down");
    } else {
        EventAnalytics.mscroll.AddScrollHistory("up");
    }

    var PercScroll = parseInt(EventAnalytics.mscroll.scroll.actualscroll*100/EventAnalytics.mscroll.scroll.maxscroll);
    //console.log(PercScroll);
    if( PercScroll % 10 == 0 &&
        EventAnalytics.mscroll.scroll.steps[PercScroll] == false ){
            console.log(PercScroll);
            EventAnalytics.mscroll.scroll.steps[ PercScroll ] = true;
    }
}

EventAnalytics.mscroll.GetLastScrollDirection = function (){
    var LastElement = EventAnalytics.mscroll.scroll.history.length-1;
    return EventAnalytics.mscroll.scroll.history[ LastElement ];
}

EventAnalytics.mscroll.IsRepeatedAction = function( actionname ){
    if( EventAnalytics.mscroll.GetLastScrollDirection() == actionname ){
        return true;
    } else {
        return false;
    }
}

EventAnalytics.mscroll.AddScrollHistory = function( actionname ){
    if( !EventAnalytics.mscroll.IsRepeatedAction( actionname ) ){
        EventAnalytics.mscroll.scroll.history.push( actionname );
        // Reset scroll steps to register scroll up percentage
        EventAnalytics.mscroll.InitScrollSteps();
    }
}

EventAnalytics.mscroll.IsScrollDown = function(){
    if( EventAnalytics.mscroll.scroll.actualscroll >
        EventAnalytics.mscroll.scroll.lastscroll &&
        EventAnalytics.mscroll.scroll.actualscroll >
        EventAnalytics.mscroll.scroll.lowreslastscroll ){
            return true;
    } else {
        return false;
    }
}

$(window).ready(function(){
    EventAnalytics.mscroll.Init();
});
