
let video;
let videoIsPlaying;
let poseNet;
let skeletons = [];
let poses = [];
let filePicker;
let uploadImg;



function setup() {
  createCanvas(600, 450).parent('canvasContainer');

  video = createCapture(VIDEO);
  video.size(width, height);
  videoIsPlaying = true;

  let options = {
      outputStride : 8,
  //  flipHorizontal : false,
  //  maxPoseDetections: 1, //detect only single pose
  //  scoreThreshold: 0.,
  //  nmsRadius: 20,
  //  detectionType: 'single'
  };

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(options);

  snapshot = select('#addPhoto');
  snapshot.mousePressed(function() {
    if (videoIsPlaying == true) {
    video.pause();
    videoIsPlaying = false;
    addPhoto.innerHTML = "Clear Image";
    poseNet.singlePose(video);
    } else {
      video.play();
      videoIsPlaying = true;
      poses.length = 0;
      myp5_1.poses.length = 0;
      document.getElementById("Name").innerHTML = "Name: ";
      addPhoto.innerHTML = "Capture Pose";
    }
    });

  poseNet.on('pose', function (results) {
    poses = results;
    submitRequest(poses)
  })

  // Hide the video element, and just show the canvas
  video.hide();

};


// create new instance mode for the second canvas, called through myp5_1
var sketch = function(p) {

p.poseNet;
p.poses = [];
p.img;
p.scalingFactor;

p.setup = function() {
p.createCanvas(600, 450).parent('canvas2');
p.background(255, 255, 255);
p.frameRate(1);
};


p.draw = function() {

  if (p.poses.length > 0) {
        p.image(p.img, ((p.width/2)-(p.img.width/2)), (p.height*0.5)-(p.img.height*0.5));
        p.drawSkeleton();
    } else {
      p.clear();
    }

    p.strokeWeight(8);
    p.stroke(0,103,71);
    p.noFill();
    p.rect(0,0,p.width,p.height);
  }
}

var myp5_1 = new p5(sketch, 'canvas2');


function classifyUpload() {
    let files;
    files = filePicker.elt.files;

    if (files.length) {
      var reader = new FileReader();

      reader.onload = function(e) {
        uploadImg = createImg(e.target.result, uploadImgReady);
        uploadImg.hide();
      };
      reader.readAsDataURL(files[0]);
    }
};



// when the image is ready, then load up poseNet
function uploadImgReady(){

  // assign poseNet
  uploadPoseNet = ml5.poseNet(uploadModelReady);

  // This sets up an event that listens to 'pose' events
  uploadPoseNet.on('pose', function (results) {
      const formName = select('#formName').elt.value;
      const poseName = select('#poseName').elt.value;
      const imgData = uploadImg.elt.src;
      const formatNames = formName.toLowerCase().replace(' ', '_');
      const formatPoseName = poseName.toLowerCase().replace(' ', '_');
      const databaseID = formatNames + '_' + formatPoseName;

      let uploadPoses = results;

      fullData = {'_id': databaseID,
                  'name': formName,
                  'pose': formatPoseName,
                  'array': uploadPoses,  // Note: the uploadPoses still need to be processed to the 52-float vector form.
                  'imgData': imgData}

      request = $.ajax({
                    type: "post",
                    url: "/upload_image",
                    data: JSON.stringify(fullData),
                    dataType: 'JSON',
                    contentType: 'application/json'
                });

      // Callback handler that will be called on success
      request.done(function (response){
        const name = response['documentArray']['name'];
        const pose = response['documentArray']['pose'];

        document.getElementById("documentAddedFeedback").innerHTML = name +"'s " + pose + " added to Cloudant!";
        document.getElementById("uploadForm").reset();
      });
  });
}


// when poseNet is ready, do the detection
function uploadModelReady() {
  uploadPoseNet.singlePose(uploadImg)
}

// Submits an Ajax request to the backend server.
function submitRequest(results) {
    request = $.ajax({
        type: "post",
        url: "/poses",
        data: JSON.stringify(results),
        dataType: 'JSON',
        contentType: 'application/json'
    });

// Callback handler that will be called on success
request.done(function (response){
    buffer = response[1];

    player_name = response[0]['Name'];
      Body = response[0];

    full_b64 = "data:image/png;base64," + buffer;
    myp5_1.clear();
    myp5_1.poses.length = 0;
    myp5_1.img = createImg(full_b64, myp5_1.uploadImgReady);
    myp5_1.img.hide();

    document.getElementById("Name").innerHTML = "Name: " + player_name;
    });
}

myp5_1.uploadImgReady = function() {

    myp5_1.options = {
        outputStride : 8
    }
//  myp5_1.poseNet = ml5.poseNet(myp5_1.imgResize, myp5_1.options);
    myp5_1.poseNet = ml5.poseNet(myp5_1.imgResize, myp5_1.options);
    myp5_1.poseNet.on('pose', gotPoses);
};

myp5_1.imgResize = function() {
// for some reason p5's resize() doesn't do this so hard coded:
  if (myp5_1.img.width > myp5_1.width) {
    let ws = myp5_1.width/myp5_1.img.width
   myp5_1.img.width = myp5_1.width;
   myp5_1.img.height = ws*myp5_1.img.height;
   myp5_1.scalingFactor = ws;
   if (myp5_1.img.height > myp5_1.height) {
     let wh = myp5_1.height/myp5_1.img.height;
   myp5_1.img.height = myp5_1.height;
   myp5_1.img.width = wh*myp5_1.img.width;
   myp5_1.scalingFactor = ws*wh;
   }
  } else if (myp5_1.img.height > myp5_1.height) {
    let wh = myp5_1.height/myp5_1.img.height
  myp5_1.img.height = myp5_1.height;
  myp5_1.img.width = wh*myp5_1.img.width;
  myp5_1.scalingFactor = wh;
} else {
  myp5_1.scalingFactor = 1;
  myp5_1.img.height = myp5_1.img.height;
  myp5_1.img.width = myp5_1.img.width;

};
  myp5_1.poseNet.singlePose(myp5_1.img);
};

 function gotPoses (things) {
 myp5_1.poses = things;
 };


function draw() {
  image(video, 0, 0, width, height);
// drawKeypoints(poses);
  drawSkeleton(poses);
  strokeWeight(8);
  stroke(0,103,71);
  noFill();
  rect(0, 0, width, height);
}


// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      strokeWeight(2);
      stroke(0,98,255);
      line(poses[i].skeleton[j][0].position.x, poses[i].skeleton[j][0].position.y, poses[i].skeleton[j][1].position.x, poses[i].skeleton[j][1].position.y);
    }
  }
}



// A function to draw the skeletons
myp5_1.drawSkeleton = function() {
    for (let j = 0; j < myp5_1.poses[0].skeleton.length; j++) {
      let partAname = myp5_1.poses[0].skeleton[j][0]["part"]
      let partBname = myp5_1.poses[0].skeleton[j][1]["part"]
      let Bodyparts = Object.keys(Body)
    for (let k = 0; k < poses[0].skeleton.length; k++) {
      let partA = myp5_1.poses[0].skeleton[j][0];
      let partB = myp5_1.poses[0].skeleton[j][1];
      let confidenceString = poses[0].skeleton[k][0]['part'] + poses[0].skeleton[k][1]['part']
      let confidence = 0.5*(poses[0].skeleton[k][0]['score'] +  poses[0].skeleton[k][1]['score'])
      for (let i = 0; i < Bodyparts.length; i++)
      {
        if (Bodyparts[i].includes(partAname && partBname) && confidenceString.includes(partAname && partBname)) {
          if (Object.entries(Body)[i][1] > 0.97 && confidence > 0.90 && Object.entries(Body)[i][0].includes(partAname) && Object.entries(Body)[i][0].includes(partBname) ) {
            let alpha = confidence
            myp5_1.stroke(0,98,255);
            myp5_1.line((partA.position.x*myp5_1.scalingFactor + ((myp5_1.width/2)-(myp5_1.img.width/2))), (partA.position.y*myp5_1.scalingFactor + ((myp5_1.height/2)-(myp5_1.img.height/2))), (partB.position.x*myp5_1.scalingFactor + ((myp5_1.width/2)-(myp5_1.img.width/2))), (partB.position.y*myp5_1.scalingFactor + ((myp5_1.height/2)-(myp5_1.img.height/2))));
      }
      }
      }
    }
}
}
