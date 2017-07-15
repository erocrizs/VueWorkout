var processErrorStack = function(trace, stack) {
	if(trace && trace.length) {
		stack.push('TRACE:');
		for(var i=0; i<stack.length; i++) {
			var t = trace[i];
      		stack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
		}
	}
	return stack.join('\n');
};

phantom.onError = function(msg, trace) {
	var stack = ['PHANTOM ERROR: ' + msg];
	console.error( processErrorStack(trace, stack) );
	phantom.exit(1);
};


var fs = require('fs');
var webpage = require("webpage");
var page = webpage.create();

var exercises = JSON.parse(fs.read('./exercises.json'));

var totalExercise = 0;
var failedExercise = 0;

exercises.size = 0;

page.onError = function(msg, trace) {
	var stack = [' SEARCH PAGE ERROR: ' + msg];
	console.error( processErrorStack(trace, stack) );
};

page.onAlert = function(subpageURL) {
	var splitMsg = subpageURL.split('/');
	var name = splitMsg[ splitMsg.length - 1 ];

	var subpage = webpage.create();

	if( exercises[name] &&
		exercises[name].name &&
		exercises[name].rating &&
		exercises[name].type &&
		exercises[name].muscle &&
		exercises[name].muscleImg &&
		exercises[name].equipment &&
		exercises[name].level &&
		exercises[name].alternatives &&

		exercises[name].how && 
		exercises[name].how.imgLeft &&
		exercises[name].how.imgRight &&
		exercises[name].how.steps &&
		exercises[name].how.vid ) {
		console.log("skipping " + subpageURL);
		exercises.size++;
		return;
	}

	console.log('Accessing ' + subpageURL + '...');

	subpage.onError = function(msg, trace) {
		var stack = [' EXERCISE PAGE ERROR: ' + msg];
		console.error( processErrorStack(trace, stack) );
	};

	var crawlerCount = 0;
	var crawlerMethod = function( status ) {
		crawlerCount++;
		if( status !== 'success' ) {
			if( crawlerCount === 6 ) {
				console.log("Failed access " + subpageURL);
				console.log("\tstatus: " + status);
				failedExercise++;
			} else {
				console.log('Trying again to access ' + subpageURL + '...');
				subpage.open( subpageURL, crawlerMethod );
			}
		}

		console.log('Successfully accessed ' + subpageURL );

		setTimeout( function() {
			exercises[name] = subpage.evaluate(function(){
				var exerciseDetail = {};
				var detailDiv = document.getElementById("exerciseDetails");
				var otherDetails = document.querySelectorAll('#exerciseDetails span');
				
				exerciseDetail["name"] = document.querySelector('#exerciseDetails h1').textContent.trim();
				exerciseDetail["rating"] = +document.querySelector("#largeratingwidget span.rating").textContent;
				
				exerciseDetail["type"] = otherDetails[0].querySelector('a').textContent.trim();
				exerciseDetail["muscle"] = otherDetails[1].querySelector('a').textContent.trim();
				exerciseDetail["muscleImg"] = document.querySelector('div#listing div div.guideImage img').getAttribute('src');
				exerciseDetail["equipment"] = otherDetails[2].querySelector('a').textContent.trim();
				exerciseDetail["level"] = otherDetails[3].querySelector('a').textContent.trim();
				
				var how = {
					imgLeft: document.querySelector("div#Male div.exercisePhotos div.photoLeft a.thickbox").getAttribute('href'),
					imgRight: document.querySelector("div#Male div.exercisePhotos div.photoRight a.thickbox").getAttribute('href'),
					vid: document.querySelector('div#maleVideo video source').getAttribute('src'),
					steps: []
				};

				var stepList = document.querySelectorAll('div#listing div div.guideContent ol li');
				for(var i=0; i<stepList.length; i++) {
					how.steps[i] = stepList[i].textContent.trim();
				}
				exerciseDetail["how"] = how;

				var alts = [];
				var altList = document.querySelectorAll('div#altExerciseCon div.exerciseName h3 a');
				for(var i=0; i<altList.length; i++) {
					var temp = altList[i].getAttribute('href').split('/');
					alts[i] = temp[ temp.length - 1 ];
				}
				exerciseDetail["alternatives"] = alts;

				return exerciseDetail;
			});
			exercises.size++;
			subpage.close();
		}, 2000);
	};

	subpage.open( subpageURL, crawlerMethod );
};

page.open('https://www.bodybuilding.com/exercises/finder', function(status) {
	if( status !== 'success' ) {
		console.log( 'Status: '  + status );
		phantom.exit();
	}
	console.log( "202" );

	var processPage = function() {
		totalExercise += page.evaluate( function() {
			var links = document.querySelectorAll('#SearchResults div div h3 a');
			for(var i = 0; i < links.length; i++) {
				alert( links[i].getAttribute('href') );
			}
			return links.length;
		} );
	};

	processPage();
	var ready = true;
	setInterval( function() {
		if( ready && totalExercise === (failedExercise + exercises.size) ) {
			console.log("SET FINISHED");
			console.log("\tsuccess: " + exercises.size);
			console.log("\tfail: " + failedExercise);
			console.log("\ttotal: " + totalExercise);
			fs.write('./exercises.json', JSON.stringify(exercises), 'w');

			var hasNext = page.evaluate( function() {
				var nextButton = document.querySelector('#finderRight #pagerDiv ul li a[title="Go to next page"]');
				if( nextButton.getAttribute('href')!=='#' ) {
					nextButton.click();
					return true;
				}
				return false;
			} );

			if( hasNext ) {
				ready = false;
				setTimeout( function() {
					processPage();
					ready = true;
				}, 2000 );
			}
			else {
				phantom.exit();
			}
			
		} else {
			console.log("status: " + exercises.size + " success, " + failedExercise + " fail, out of " + totalExercise );
		}
	}, 1000 );
});