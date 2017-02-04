/*
    Event Analytics 1.0.1
    
    The developer friendly javascript library to do
    Event Tracking using Google Analytics or Piwik
    
    Author: Fabio Buda <fabiobuda@netd.it>
    First release: October 24 2015
    Last release: November 01 2015
    Copyright: Netdesign 2015-2016
    Copyright holder address: 96013 Carlentini (SR) Italy
    Dependencies = Piwik x.x+ or GA, jQuery 1.8+
    
    Many info at http://www.eventanalytics.org
    
    This software is released under GNU GPL License terms:
    
    -- GNU GPL LICENSE:
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    -- END GNU GPL LICENSE
*/

/*
    ChangeLog:
    v1.0.1 - 04.02.2017 fabiobuda@netd.it
        [Feature] Added support for get selected text on Desktop and Mobile
        [Feature] Added support to register custom dimensions (simple proxy to Piwik or GA)
*/

/*
    Startswith Polyfill
    fabiobuda@netd.it - 25-10-2015
    Source: http://stackoverflow.com/a/646643
*/
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

var EventAnalytics = EventAnalytics || {};

EventAnalytics.Hostname = window.location.host || window.location.hostname;
EventAnalytics.IsPiwik = false;
EventAnalytics.IsGA = false;

EventAnalytics.Init = function(){
    if( Piwik !== null && typeof(Piwik) === 'object' ){
        EventAnalytics.IsPiwik = true;
        EventAnalytics.Tracker = Piwik.getAsyncTracker();
        EventAnalytics._Init();
    } else if( ga !== null && typeof(ga) === 'function' ){
        EventAnalytics.IsGA = true;
        EventAnalytics._Init();
    } else {
        console.log("No Piwik or GA analytics library detected!");
    }
}

EventAnalytics._Init = function(){
    EventAnalytics.InitVisitor();
    EventAnalytics.RegisterLateEventData();
    EventAnalytics.RegisterDelayEventData();
    var Scroll = {"25":false, "50":false, "75":false};
    EventAnalytics.Scroll = Scroll;
    EventAnalytics.InitScrollEvents();
    EventAnalytics.EventAnalytics.InitTextSelection();
}

EventAnalytics.RegisterNewVisitorCallback = function( callback, delay ){
    delay = typeof delay !== 'undefined' ? delay : 25;
    if( EventAnalytics.IsNewVisitor ){
        setTimeout( callback, delay );
    }
}

EventAnalytics.RegisterReturingVisitorCallback = function( callback, delay ){
    delay = typeof delay !== 'undefined' ? delay : 25;
    if( !EventAnalytics.IsNewVisitor ){
        setTimeout( callback, delay );
    }
}

/*
    You should rename this method
    from RegisterLateEventData
    to FetchLateEventData
*/
EventAnalytics.RegisterLateEventData = function(){
    var hash = window.location.hash;
    if( hash.startsWith("#_ea_pwkdt_=") ){
        window.location.hash = "";
        var lateDt = hash.replace("#_ea_pwkdt_=", "").split(";");
        EventAnalytics.RegisterUIEvent( lateDt[0], lateDt[1], lateDt[2], lateDt[3] );
    }
}

EventAnalytics.RegisterDelayEventData = function(){
    var cookie = EventAnalytics.CookieStorage.read("_ea_pwkdt_");
    if( cookie != null && cookie != "" ){
        var lateDt = cookie.split("|");
        EventAnalytics.RegisterUIEvent( lateDt[0], lateDt[1], lateDt[2], lateDt[3] );
        EventAnalytics.CookieStorage.erase("_ea_pwkdt_");
    }
}

EventAnalytics.InitScrollEvents = function(){
var scrollTop = $(document).height() - $(window).height();
$( window ).scroll(function() {
  if( $(window).scrollTop() > 25 ){
      if( $(window).scrollTop() > 3*(scrollTop/4) && EventAnalytics.Scroll['75'] == false ) {
          // Scrolled 75%
          EventAnalytics.Scroll['75'] = true;
          EventAnalytics.RegisterUIEvent("Window", "scroll", "scroll75");
          //console.log("75");
      } else if( $(window).scrollTop() > 2*(scrollTop/4) && EventAnalytics.Scroll['50'] == false ){
          // Scrolled 50%
          EventAnalytics.Scroll['50'] = true;
          EventAnalytics.RegisterUIEvent("Window", "scroll", "scroll50");
          //console.log("50");
      } else if( $(window).scrollTop() > (scrollTop/4) && EventAnalytics.Scroll['25'] == false ){
          // Scrolled 25%
          EventAnalytics.Scroll['25'] = true;
          EventAnalytics.RegisterUIEvent("Window", "scroll", "scroll25");
          //console.log("25");
      }
  }
});
}

EventAnalytics.InitVisitor = function(){
    if( EventAnalytics.IsGA ){
        EventAnalytics.InitVisitorGA();
    } else if( EventAnalytics.IsPiwik ){
        EventAnalytics.InitVisitorPiwik();
    }
}

EventAnalytics.InitVisitorPiwik = function(){
    var VisitorInfo = EventAnalytics.Tracker.getVisitorInfo();
    // Is new visitor seems to not work :(
    // it returns always 0 even if the user is
    // really new. You should use "number of visits"
    // to know if the visitor is new or not
    EventAnalytics.IsNewVisitor = VisitorInfo[0];
    EventAnalytics.VisitorID = VisitorInfo[1];
    EventAnalytics.ProfileCreationTimestamp = VisitorInfo[2];
    EventAnalytics.NumberOfVisits = VisitorInfo[3];
    EventAnalytics.CurrentVisitTimestamp = VisitorInfo[4];
    EventAnalytics.LastVisitTimestamp = VisitorInfo[5];
    EventAnalytics.LastEcommerceOrderTimestamp = VisitorInfo[6];
    // Use the NumberOfVisits to discover if the visitor
    // is new or NOT
    if( EventAnalytics.NumberOfVisits == 1 ){
        EventAnalytics.IsNewVisitor = 1;
    } else {
        EventAnalytics.IsNewVisitor = 0;
    }
}

EventAnalytics.InitVisitorGA = function(){
    var Cookie = EventAnalytics.CookieStorage.read("_ga").split(".");
    EventAnalytics.IsNewVisitor = true;
    EventAnalytics.VisitorID = Cookie[2];
    EventAnalytics.ProfileCreationTimestamp = Cookie[3];
    EventAnalytics.NumberOfVisits = 0;
    EventAnalytics.CurrentVisitTimestamp = false;
    EventAnalytics.LastVisitTimestamp = false;
    EventAnalytics.LastEcommerceOrderTimestamp = false;
    /*
        YOU SHOULD USE EventAnalytics.ProfileCreationTimestamp
        to discover if returning visitor or NOT :)
    */
    var NowTS = new Date().getTime();
    var DeltaTime = NowTS-(EventAnalytics.ProfileCreationTimestamp*1000);
    var DeltaTimeHours = DeltaTime/1000/60/60;
    console.log(DeltaTimeHours);
    if( EventAnalytics.ProfileCreationTimestamp > 2 ){
        EventAnalytics.IsNewVisitor = false;
    }
}

EventAnalytics.InitTextSelection = function(){
    EventAnalytics.Utils.StartListenSelectTextEvent( EventAnalytics._TextSelectCallBack );
}
EventAnalytics._TextSelectCallBack = function( text ){
    EventAnalytics.RegisterUIEvent("document", "selection", "text", text);
}

EventAnalytics.RegisterUIEvent = function( category, action, name, value ){
    /* */
    var cat = "UI_"+category;
    if( EventAnalytics.IsGA ){
        ga('send', 'event', cat, action, name, value);
    } else if( EventAnalytics.IsPiwik ){
        EventAnalytics.Tracker.trackEvent(cat, action, name, value);
    }
}

/*
    Custom Dimensions is a feature that have both Piwik and GA
    * Piwik limits the number of custom dimensions to 5 even if you can
      configure more custom dimensions rebuilding your DB schema
      Many info at:
      https://piwik.org/docs/custom-dimensions/#data-limits-for-custom-dimensions
      http://piwik.org/faq/how-to/faq_17931/
    * GA limits the number of custom dimensions to 20 for free users
      and to 200 for premium Google Analytics Users
      Many info at:
      https://developers.google.com/analytics/devguides/collection/analyticsjs/custom-dims-mets

    We leave to the user the correct management of dimensions
*/
EventAnalytics.RegisterCustomDimension = function( index, value ){
    if( EventAnalytics.IsGA ){
        ga('send', 'pageview', { index:  value });
    } else if( EventAnalytics.IsPiwik ){
        EventAnalytics.Tracker.setCustomDimension(index, value);
    }
}

EventAnalytics.ParseNameVariables = function( event, varname ){
    var element = $(event.target);
    var content = "unkwown";
    if( varname == "%content" ){
        content = element.text().trim();
    } else if( varname == "%title" ){
        content = element.attr("title").trim();
    } else if( varname == "%parentcontent" ){
        content = element.parent().text().trim();
    } else if( varname == "%parenttitle" ){
        content = element.parent().attr("title").trim();
    } else {
        content = varname;
    }
    return content;
}

EventAnalytics.RegisterDOMEvent = function( selector, bindevent, category, action, name, value){
    $(selector).on(bindevent, function(e){
        var content = EventAnalytics.ParseNameVariables(e, name);
        EventAnalytics.RegisterUIEvent(category, action, content, value);
    });
}

/*
    To be used when a user follows a LINK HREF
    to store the button action in the next pageView
    This function alters the HREF attribute to
    pass the analytics information to the next pageview
    but DOESN'T produce any UI delay.
*/
EventAnalytics.LateRegisterDOMEvent = function( selector, bindevent, category, action, name, value){
    $(selector).on(bindevent, function(e){
        var element = $(e.target);
        var content = EventAnalytics.ParseNameVariables(e, name);
        if( element.prop("tagName") == "A" ){
            var href = element.attr("href");
            /*
                Avoid to add a "storage hash" to links
                that has an hash yet in their HREF
                FEA1 request 25-10-2015
            */
            if( href.indexOf("#") === -1 ){
                element.attr("href", href+"#_ea_pwkdt_="+category+"_late;"+action+";"+content+";"+value);
            } else {
                // Here you could graceful
                // call DelayRegisterDOMEvent() with
                // all the same parameters as a backend
            }
        }
    });
}

EventAnalytics.DelayRegisterDOMEvent = function( selector, bindevent, category, action, name, value){
    $(selector).on(bindevent, function(e){
        var element = $(e.target);
        var content = EventAnalytics.ParseNameVariables(e, name);
        EventAnalytics.CookieStorage.create("_ea_pwkdt_", category+"_delay|"+action+"|"+content+"|"+value);
        if( element.prop("tagName") == "A" ){
            //console.log("A");
            element.unbind("click");
            setTimeout(function(){ window.location = $(element).attr("href"); }, 125);
            return false;
        } else if( element.prop("tagName") == "FORM" ) {
            //console.log("FORM");
            element.unbind("submit");
            setTimeout(function(){ element.submit(); }, 125);
            return false;
        }
    });
}

EventAnalytics.TrackFormInteraction = function(){
    var form = $('form.EventAnalytics');
    if( form.size() == 1 ){
        // Track the interaction with
        // every single INPUT different
        // from type="hidden"
        form.find("input").each(function(index){
            EventAnalytics.RegisterInputFieldEvent(this);
        });
    } else {
        // Print a different message if there are
        // less or more than 1 form.EventAnalytics
        //console.log("You are allowed to track a single FULL form per page. If you need to track some other forms you should use the EventAnalytics.RegisterDOMEvent() using a selector for a FORM and a SUBMIT event binding");
    }
}

EventAnalytics.RegisterInputFieldEvent = function( input ){
    var InputType = $(input).attr("type");
    var InputName = $(input).attr("name");
    var InputId = $(input).attr("id");
    if( !InputId ){
        InputId = InputName;
    }
    if(InputType != "hidden"){
        var InputPlaceholder;
        if( $(input).attr("placeholder") ){
            InputPlaceholder = $(input).attr("placeholder");
        } else {
            // Search for a label for="inputName"
            InputPlaceholder = $('label[for="'+InputId+'"]').text();
            //console.log(InputId);
            //console.log(InputPlaceholder);
        }
        $(input).attr("data-input-name", InputPlaceholder);
        $(input).on("focus", EventAnalytics.InputInteractionDetectorCallback);
        $(input).on("keyup", EventAnalytics.InputInteractionDetectorCallback);
    }
}

EventAnalytics.InputInteractionDetectorCallback = function( event ){
    var target = $(event.target);
    console.log(event.type);
    if( event.type == "keyup" ){
        if(target.val() != ""){
            $(this).unbind(event.type);
            var content = $(this).attr("data-input-name");
            EventAnalytics.RegisterUIEvent("FormInput", event.type, content);
        }
    } else if( event.type != "keyup" ) {
        $(this).unbind(event.type);
        var content = $(this).attr("data-input-name");
        EventAnalytics.RegisterUIEvent("FormInput", event.type, content);
    }
}

/*
    CookieStorage is freely inspired by Peter-Paul Koch
    original source code is available at:
    http://www.quirksmode.org/js/cookies.html#script
*/
EventAnalytics.CookieStorage = EventAnalytics.CookieStorage || {};

EventAnalytics.CookieStorage.DefaultExpire = 2;

EventAnalytics.CookieStorage.create = function(name, value, minutes){
    if( minutes ){
        var date = new Date();
        date.setTime(date.getTime()+(minutes*60*1000));
        var expires = "; expires="+date.toGMTString();
    } else {
        var date = new Date();
        var expMinutes = EventAnalytics.CookieStorage.DefaultExpire*60*1000;
        date.setTime(date.getTime()+(expMinutes));
        var expires = "; expires="+date.toGMTString();
    }
    document.cookie = name+"="+value+expires+"; path=/";
}

EventAnalytics.CookieStorage.read = function(nameEQ){
    var nameEQ = nameEQ + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i].trim();
        if( c.startsWith(nameEQ) ){
            return c.split("=")[1];
        }
    }
    return null;
}

EventAnalytics.CookieStorage.erase = function(name){
    EventAnalytics.CookieStorage.create(name,"",-1);
}


/*
    Utils contains useful functions for
    getting selected text by user
*/
EventAnalytics.Utils = EventAnalytics.Utils || {};

EventAnalytics.Utils.getSelectedText = function(){
    var ret = '';
    if (window.getSelection) {
        ret = window.getSelection().toString();
    } else if (document.selection) {
        ret = document.selection.createRange().text;
    }
    return ret;
}

EventAnalytics.Utils.LastSelectedText = false;
EventAnalytics.Utils.SelectTextEventFired = false;

/*
    Tested on:
    Chrome, Firefox, Opera Desktop
    iOS 10 Safari, Android 4.4.2 Chrome
    It works very well on Desktop and iOS
    but is not stable on Android Chrome
*/
EventAnalytics.Utils.StartListenSelectTextEvent = function( callback ){
    $(document).on("mouseup touchend onselectstart onselectend onselectionchange", function(e) {
        e.preventDefault();
        if( !EventAnalytics.Utils.SelectTextEventFired ){
            var text=EventAnalytics.Utils.getSelectedText();
            if (text!='' && text != EventAnalytics.Utils.LastSelectedText){
                EventAnalytics.Utils.LastSelectedText = text;
                callback( text );
            }
            EventAnalytics.Utils.SelectTextEventFired = true;
            setTimeout(function(){ EventAnalytics.Utils.SelectTextEventFired = false; }, 50);
        }
    });
}

EventAnalytics.Utils.getMetadata = function(){
    var title = document.title;
    var description = $("meta[name='description']").attr("content");
    var keywords = $("meta[name='keywords']").attr("content");
    //alert(title);
    //alert(description);
    //alert(keywords);
}
