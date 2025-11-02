let video;
let poseNet;
let poses = [];
let previousPoses = [];
let nodeData = [];
let modelLoaded = false;
let floatingNodes = [];
let nodeConnections = [];
let isUsingCamera = true;
let videoWidth = 640;
let videoHeight = 480;
let isSeeking = false;

function setup() {
    let canvasWidth = window.innerWidth * 0.5;
    let canvasHeight = window.innerHeight;

    createCanvas(canvasWidth, canvasHeight);

    // Initialize node data for 17 keypoints
    initializeNodeData();

    // Start with camera
    startCamera();

    // Setup button controls
    setupControls();
}

function initializeNodeData() {
    nodeData = [];
    for (let i = 0; i < 17; i++) {
        nodeData.push({
            number: random(0, 999),
            targetNumber: random(0, 999),
            squareSize: 20,
            targetSize: 20,
            lastUpdate: 0,
            satellites: [] // Floating nodes around this keypoint
        });

        // Create 3-5 satellite nodes for each keypoint
        for (let j = 0; j < floor(random(3, 6)); j++) {
            nodeData[i].satellites.push({
                angle: random(TWO_PI),
                distance: random(30, 80),
                speed: random(0.01, 0.03),
                size: random(10, 18),
                number: random(0, 999),
                targetNumber: random(0, 999),
                opacity: random(0.3, 1),
                targetOpacity: random(0.3, 1),
                flickerSpeed: random(0.05, 0.15)
            });
        }
    }
}

function startCamera() {
    if (video) {
        video.remove();
    }
    if (poseNet) {
        poseNet.removeAllListeners();
    }
    modelLoaded = false;
    poses = [];
    previousPoses = [];

    // Hide video controls for camera
    document.getElementById('videoControls').classList.remove('visible');

    document.getElementById('info').textContent = 'Starting camera...';
    document.getElementById('info').style.display = 'block';

    video = createCapture(VIDEO, videoReady);
    video.size(videoWidth, videoHeight);
    video.hide();
    isUsingCamera = true;
}

function startUploadedVideo(file) {
    if (video) {
        video.remove();
    }
    if (poseNet) {
        poseNet.removeAllListeners();
    }
    modelLoaded = false;
    poses = [];
    previousPoses = [];

    document.getElementById('info').textContent = 'Loading video...';
    document.getElementById('info').style.display = 'block';

    video = createVideo(URL.createObjectURL(file), () => {
        // Video loaded callback
        video.size(videoWidth, videoHeight);
        video.loop();
        video.volume(0);

        // Show video controls and setup timeline
        document.getElementById('videoControls').classList.add('visible');
        setupVideoControls();

        // Initialize PoseNet
        videoReady();

        // Play the video after everything is set up
        video.elt.play().catch(err => {
            console.log('Initial play failed:', err);
        });
    });
    video.hide();
    isUsingCamera = false;
}

function setupVideoControls() {
    // Update timeline as video plays
    const updateTimeline = () => {
        const currentTime = video.elt.currentTime;
        const duration = video.elt.duration;

        if (duration) {
            const percentage = (currentTime / duration) * 100;
            document.getElementById('progress').style.width = percentage + '%';
            document.getElementById('timeDisplay').textContent = formatTime(currentTime) + ' / ' + formatTime(duration);
        }
    };

    // Update button state
    const updateButtonState = () => {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.textContent = video.elt.paused ? 'Play' : 'Pause';
        }
    };

    // Handle video end (ensure it loops)
    const handleEnded = () => {
        video.elt.currentTime = 0;
        video.elt.play().catch(err => {
            console.log('Loop play failed:', err);
        });
    };

    // Handle video errors
    const handleError = (e) => {
        console.error('Video error:', e);
        document.getElementById('info').textContent = 'Error loading video';
        document.getElementById('info').style.display = 'block';
    };

    // Ensure video stays at correct size
    const handleLoadedMetadata = () => {
        video.size(videoWidth, videoHeight);
    };

    // Attach video event listeners
    video.elt.addEventListener('timeupdate', updateTimeline);
    video.elt.addEventListener('ended', handleEnded);
    video.elt.addEventListener('error', handleError);
    video.elt.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.elt.addEventListener('play', updateButtonState);
    video.elt.addEventListener('pause', updateButtonState);

    // Track seeking state
    let seekTarget = null;

    video.elt.addEventListener('seeking', () => {
        console.log('Seeking started - clearing old poses');
        isSeeking = true;
        // Clear old poses immediately
        poses = [];
        previousPoses = [];
        // Reset position tracking
        lastNosePosition = null;
        console.log('Reset nose position tracking');
    });

    video.elt.addEventListener('waiting', () => {
        console.log('Video waiting for data...');
    });

    video.elt.addEventListener('canplay', () => {
        console.log('Video can play, readyState:', video.elt.readyState);
    });

    video.elt.addEventListener('loadeddata', () => {
        console.log('Video loaded data');
    });

    video.elt.addEventListener('seeked', () => {
        console.log('Seek completed, readyState:', video.elt.readyState, 'paused:', video.elt.paused);

        // Clear poses again to ensure no stale data
        poses = [];
        previousPoses = [];
        console.log('Cleared poses after seek');

        // Wait for video frame to be ready
        setTimeout(() => {
            console.log('Video frame should be ready at new position');

            // Restart PoseNet detection
            if (poseNet) {
                console.log('Restarting PoseNet detection system...');

                // Remove and re-add event listener
                poseNet.removeAllListeners('pose');
                poseNet.on('pose', (results) => {
                    gotPoses(results);
                });

                console.log('PoseNet event listener restarted');

                // Trigger a manual single pose detection to kickstart detection on new frame
                setTimeout(() => {
                    console.log('Triggering manual pose detection on new frame...');
                    poseNet.singlePose(video).then(results => {
                        console.log('Manual detection complete, poses:', results.length);
                        if (results.length > 0) {
                            gotPoses(results);
                        }
                    }).catch(err => {
                        console.error('Manual detection failed:', err);
                    });
                }, 50);
            }

            isSeeking = false;

            // If we have a pending play, execute it now
            if (seekTarget !== null && seekTarget.shouldPlay) {
                console.log('Attempting to resume playback...');
                video.elt.play().then(() => {
                    console.log('Successfully resumed playback after seek');
                }).catch(err => {
                    console.error('Could not resume:', err);
                });
            } else {
                console.log('Video was paused before seeking, staying paused');
            }

            seekTarget = null;
        }, 150);
    });

    // Click timeline to seek
    const handleTimelineClick = (e) => {
        const timeline = document.getElementById('timeline');
        const rect = timeline.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const duration = video.elt.duration;

        if (duration && !isNaN(duration)) {
            const wasPlaying = !video.elt.paused;
            const targetTime = duration * percentage;

            console.log('=== TIMELINE CLICK ===');
            console.log('Seeking to:', targetTime);
            console.log('Was playing:', wasPlaying);
            console.log('Current time:', video.elt.currentTime);

            // Store the playback state
            seekTarget = { shouldPlay: wasPlaying };

            // Pause before seeking to ensure clean seek
            if (!video.elt.paused) {
                video.elt.pause();
            }

            // Set the new time
            video.elt.currentTime = targetTime;
        }
    };

    // Play/Pause button
    const handlePlayPauseClick = () => {
        if (video.elt.paused) {
            video.elt.play().catch(err => {
                console.log('Play failed:', err);
            });
        } else {
            video.elt.pause();
        }
    };

    // Remove old event listeners and add new ones
    const timeline = document.getElementById('timeline');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // Clone to remove old listeners
    const newTimeline = timeline.cloneNode(true);
    timeline.parentNode.replaceChild(newTimeline, timeline);

    const newPlayPauseBtn = playPauseBtn.cloneNode(true);
    playPauseBtn.parentNode.replaceChild(newPlayPauseBtn, playPauseBtn);

    // Add new listeners
    newTimeline.addEventListener('click', handleTimelineClick);
    newPlayPauseBtn.addEventListener('click', handlePlayPauseClick);

    // Set initial button state
    newPlayPauseBtn.textContent = 'Pause';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function setupControls() {
    const cameraBtn = document.getElementById('cameraBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const videoInput = document.getElementById('videoInput');

    cameraBtn.addEventListener('click', () => {
        startCamera();
    });

    uploadBtn.addEventListener('click', () => {
        videoInput.click();
    });

    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            startUploadedVideo(file);
        }
    });
}

function videoReady() {
    console.log('Video ready, initializing PoseNet...');
    document.getElementById('info').textContent = 'Video ready! Loading PoseNet...';

    // Initialize PoseNet with specific options
    const options = {
        architecture: 'MobileNetV1',
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: isUsingCamera, // Only flip for camera
        minConfidence: 0.3,
        maxPoseDetections: 1,
        scoreThreshold: 0.3,
        nmsRadius: 20,
        detectionType: 'single',
        inputResolution: 257,
        multiplier: 0.75,
        quantBytes: 2
    };

    poseNet = ml5.poseNet(video, options, modelReady);

    // Use continuous pose detection
    poseNet.on('pose', (results) => {
        gotPoses(results);
    });
}

function modelReady() {
    console.log('PoseNet Model Loaded!');
    modelLoaded = true;
    document.getElementById('info').textContent = 'PoseNet ready! Move around!';
    setTimeout(() => {
        document.getElementById('info').style.display = 'none';
    }, 3000);
}

let lastPoseTime = 0;
let poseEventCount = 0;
let lastNosePosition = null;

function gotPoses(results) {
    previousPoses = poses;
    poses = results;
    poseEventCount++;

    // Check if poses are actually updating by tracking nose position
    if (results.length > 0 && results[0].pose && results[0].pose.keypoints) {
        let noseKeypoint = results[0].pose.keypoints.find(kp => kp.part === 'nose');
        if (noseKeypoint && noseKeypoint.score > 0.3) {
            let currentNose = {x: noseKeypoint.position.x, y: noseKeypoint.position.y};

            // Check if nose moved significantly
            if (lastNosePosition) {
                let distance = dist(currentNose.x, currentNose.y, lastNosePosition.x, lastNosePosition.y);
                if (distance < 1) {
                    console.warn('⚠ Poses detected but NOT MOVING! Nose at same position:', currentNose);
                }
            }

            lastNosePosition = currentNose;
        }
    }

    let now = millis();
    if (now - lastPoseTime > 5000) { // Log every 5 seconds
        console.log('✓ PoseNet event fired! Total events:', poseEventCount, 'Poses found:', results.length);
        if (lastNosePosition) {
            console.log('  Nose position:', lastNosePosition);
        }
        lastPoseTime = now;
    }

    // Log occasionally to verify PoseNet is still working
    if (frameCount % 60 === 0) {
        if (results.length === 0) {
            console.warn('⚠ PoseNet is running but finding no poses!');
        }
    }
}

function draw() {
    background(0);

    // Calculate centered position for video
    let videoX = (width - videoWidth) / 2;
    let videoY = (height - videoHeight) / 2;

    // Draw video feed if it exists
    if (video && video.elt) {
        // Always try to draw the video, even during seeking
        // The video element should show the last available frame
        try {
            push();
            translate(videoX, videoY);

            if (isUsingCamera) {
                translate(videoWidth, 0);
                scale(-1, 1);
            }

            // Draw the video
            image(video, 0, 0, videoWidth, videoHeight);
            pop();

            // Show status indicators
            if (isSeeking) {
                push();
                fill(255, 255, 255, 150);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(14);
                text('Seeking...', width/2, videoY + videoHeight + 20);
                pop();
            }

            // Debug status indicator (top-left of video)
            if (video && video.elt) {
                push();
                fill(0, 255, 0, 200);
                noStroke();
                textAlign(LEFT, TOP);
                textSize(12);
                let status = video.elt.paused ? '⏸ PAUSED' : '▶ PLAYING';
                let poseStatus = poses.length > 0 ? ' | ✓ Detecting' : ' | ✗ No poses';
                text(status + poseStatus, videoX + 10, videoY + 10);
                pop();
            }
        } catch (e) {
            console.error('Error drawing video:', e);
            pop();
        }
    }

    // Draw poses if model is loaded
    // Show poses even during seeking if we have valid pose data
    if (modelLoaded && poses.length > 0) {
        try {
            push();
            translate(videoX, videoY);
            updateNodeConnections();
            drawNodeConnections();
            drawSkeleton();
            drawKeypoints();
            pop();
        } catch (e) {
            console.error('Error drawing poses:', e);
            pop();
        }
    }
}

function updateNodeConnections() {
    // Randomly update connections every frame
    if (frameCount % 10 === 0 && poses.length > 0 && poses[0].pose) {
        nodeConnections = [];
        let allNodes = [];

        // Collect all visible nodes
        let pose = poses[0].pose;
        if (!pose.keypoints) return;

        for (let i = 0; i < pose.keypoints.length; i++) {
            let keypoint = pose.keypoints[i];
            if (keypoint && keypoint.score > 0.3 && keypoint.position) {
                allNodes.push({
                    x: keypoint.position.x,
                    y: keypoint.position.y,
                    isMain: true
                });

                // Add satellite positions
                if (nodeData[i] && nodeData[i].satellites) {
                    for (let sat of nodeData[i].satellites) {
                        let angle = sat.angle;
                        let dist = sat.distance;
                        allNodes.push({
                            x: keypoint.position.x + cos(angle) * dist,
                            y: keypoint.position.y + sin(angle) * dist,
                            isMain: false
                        });
                    }
                }
            }
        }

        // Create random connections
        let numConnections = floor(random(5, 15));
        for (let i = 0; i < numConnections && allNodes.length > 1; i++) {
            let a = floor(random(allNodes.length));
            let b = floor(random(allNodes.length));
            if (a !== b) {
                let d = dist(allNodes[a].x, allNodes[a].y, allNodes[b].x, allNodes[b].y);
                if (d < 150) { // Only connect nearby nodes
                    nodeConnections.push({
                        from: allNodes[a],
                        to: allNodes[b],
                        opacity: random(0.2, 0.6)
                    });
                }
            }
        }
    }
}

function drawNodeConnections() {
    for (let conn of nodeConnections) {
        stroke(255, 255, 255, conn.opacity * 255);
        strokeWeight(1);
        line(conn.from.x, conn.from.y, conn.to.x, conn.to.y);
    }
}

function drawKeypoints() {
    if (poses.length > 0 && poses[0].pose && poses[0].pose.keypoints) {
        let pose = poses[0].pose;
        let previousPose = previousPoses.length > 0 && previousPoses[0].pose ? previousPoses[0].pose : null;

        for (let i = 0; i < pose.keypoints.length; i++) {
            let keypoint = pose.keypoints[i];

            // Only show keypoints with high confidence
            if (keypoint && keypoint.score > 0.3 && keypoint.position) {
                // Ensure nodeData exists for this index
                if (!nodeData[i]) continue;

                // Calculate movement
                let movement = 0;
                if (previousPose && previousPose.keypoints[i] && previousPose.keypoints[i].score > 0.3 && previousPose.keypoints[i].position) {
                    let prevKp = previousPose.keypoints[i];
                    movement = dist(
                        keypoint.position.x,
                        keypoint.position.y,
                        prevKp.position.x,
                        prevKp.position.y
                    );
                }

                // Update numbers based on movement
                let currentTime = millis();
                if (movement > 3) {
                    if (currentTime - nodeData[i].lastUpdate > 100) {
                        nodeData[i].targetNumber = random(0, 999);
                        nodeData[i].lastUpdate = currentTime;
                    }
                    nodeData[i].targetSize = map(movement, 0, 30, 20, 35, true);
                } else {
                    nodeData[i].targetSize = 20;
                }

                // Smooth transitions
                nodeData[i].number = lerp(nodeData[i].number, nodeData[i].targetNumber, 0.2);
                nodeData[i].squareSize = lerp(nodeData[i].squareSize, nodeData[i].targetSize, 0.15);

                // Update and draw satellite nodes
                if (nodeData[i].satellites) {
                    for (let sat of nodeData[i].satellites) {
                        // Rotate satellite
                        sat.angle += sat.speed;

                        // Update flickering
                        if (frameCount % 3 === 0) {
                            sat.targetOpacity = random(0.3, 1);
                        }
                        sat.opacity = lerp(sat.opacity, sat.targetOpacity, sat.flickerSpeed);

                        // Update number on movement
                        if (movement > 2) {
                            if (random() < 0.1) {
                                sat.targetNumber = random(0, 999);
                            }
                        }
                        sat.number = lerp(sat.number, sat.targetNumber, 0.15);

                        // Calculate satellite position
                        let satX = keypoint.position.x + cos(sat.angle) * sat.distance;
                        let satY = keypoint.position.y + sin(sat.angle) * sat.distance;

                        // Draw satellite node
                        drawSatelliteNode(satX, satY, sat);
                    }
                }

                // Draw the main keypoint node
                drawMainNode(keypoint, nodeData[i]);
            }
        }
    }
}

function drawMainNode(keypoint, data) {
    push();
    translate(keypoint.position.x, keypoint.position.y);

    // White square with thin border
    noFill();
    stroke(255, 255, 255, 200);
    strokeWeight(1.5);
    rectMode(CENTER);
    rect(0, 0, data.squareSize, data.squareSize);

    // Center point
    fill(255);
    noStroke();
    circle(0, 0, 4);

    // Draw number
    fill(255, 255, 255);
    textAlign(CENTER, TOP);
    textSize(11);
    textStyle(BOLD);
    text(Math.floor(data.number), 0, data.squareSize/2 + 6);

    pop();
}

function drawSatelliteNode(x, y, sat) {
    push();
    translate(x, y);

    // Flickering white square
    let alpha = sat.opacity * 255;
    noFill();
    stroke(255, 255, 255, alpha);
    strokeWeight(1);
    rectMode(CENTER);
    rect(0, 0, sat.size, sat.size);

    // Small center point
    fill(255, 255, 255, alpha);
    noStroke();
    circle(0, 0, 3);

    // Draw number with flickering
    fill(255, 255, 255, alpha);
    textAlign(CENTER, TOP);
    textSize(9);
    textStyle(NORMAL);
    text(Math.floor(sat.number), 0, sat.size/2 + 4);

    pop();
}

function drawSkeleton() {
    if (poses.length > 0 && poses[0].skeleton) {
        let skeleton = poses[0].skeleton;
        if (skeleton && Array.isArray(skeleton)) {
            for (let i = 0; i < skeleton.length; i++) {
                if (!skeleton[i] || skeleton[i].length < 2) continue;

                let a = skeleton[i][0];
                let b = skeleton[i][1];

                if (a && b && a.score > 0.3 && b.score > 0.3 && a.position && b.position) {
                    strokeWeight(2);
                    stroke(100, 150, 255, 120);
                    line(
                        a.position.x,
                        a.position.y,
                        b.position.x,
                        b.position.y
                    );
                }
            }
        }
    }
}
