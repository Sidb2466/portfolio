/*
  This project is inspired by and partially based on
  "Mario Bros Resume" by Miquel Camps
  https://vivirenremoto.github.io/mariocv/

  Code has been modified, extended, and customized
  for a personal portfolio project by Siddharth Brahmankar.
*/
var ismobile = navigator.userAgent.match(/(iPhone)|(iPod)|(android)|(webOS)|(BlackBerry)/i);
var scroll_x = $(window).width() / 2;
var floor_x = 0;
var mario_x = 0;
var direction = false;
var music_play = false;
var interval_left = false;
var interval_right = false;
var boxHitThisJump = false;
var isJumping = false;
var jumpInterval = null;
const jumpSound = new Audio('public/jump.mp3');
const boxHitSound = new Audio('public/box-hit.mp3');
const WORLD_WIDTH = 3200;
const flagSound = new Audio('public/flag.mp3');
flagSound.volume = 0.4;
boxHitSound.volume = 0.3;
jumpSound.volume = 0.3;

if (ismobile) scroll_x -= 170;
else scroll_x -= 240;
$('#scroll').css('left', scroll_x + 'px');

function renderMario(yOffset = 0) {
    const scale = direction === 'left' ? -1 : 1;
    const mario = document.getElementById('mario');
    mario.style.transform = `translateY(${-yOffset}px) scaleX(${scale})`;
}

function moveTo(pos) {
    let diff = ismobile ? 14 : 22;
    checkPoleHit();
    if (pos === 'left') {
        floor_x += diff;
        scroll_x += diff;
        mario_x -= 65;
        if (mario_x === -195) mario_x = 0;
    } 
    else if (pos === 'right') {
        floor_x -= diff;
        scroll_x -= diff;
        mario_x -= 65;
        if (mario_x === -195) mario_x = 0;
    }
    if (scroll_x < -WORLD_WIDTH) {
        scroll_x = $(window).width();
    } else if (scroll_x > $(window).width()) {
        scroll_x = -WORLD_WIDTH;
    }
    $('#scroll').css('left', scroll_x + 'px');
    $('#floor').css('background-position-x', floor_x + 'px');
    $('#mario').css('background-position-x', mario_x + 'px');
}

function playMusic() {
    const music = document.getElementById("bg_music");
    if (!music_play) {
        music.volume = 0.4;
        music.play();
        music_play = true;
        $('#music-btn').text('Music: ON');
    }
}

function moveLeft() {
    playMusic();
    if (!interval_left) {
        interval_left = setInterval(function () { moveTo('left'); }, 60);
    }
}

function moveRight() {
    playMusic();
    if (!interval_right) {
        interval_right = setInterval(function () { moveTo('right'); }, 60);
    }
}

function stopMove() {
    clearInterval(interval_left);
    clearInterval(interval_right);
    interval_left = false;
    interval_right = false;
}

function hitBoxesDuringJump(marioRect) {
    if (boxHitThisJump) return;
    document.querySelectorAll('.box').forEach(box => {
        const boxRect = box.getBoundingClientRect();
        const horizontalHit =
            marioRect.right > boxRect.left + 10 &&
            marioRect.left < boxRect.right - 10;
        const verticalHit =
            marioRect.top <= boxRect.bottom + 5 &&
            marioRect.top >= boxRect.bottom - 30;
        if (horizontalHit && verticalHit) {
            boxHitThisJump = true;
            box.classList.add('hit');
            boxHitSound.currentTime = 0;
            boxHitSound.play();
            setTimeout(() => { box.classList.remove('hit'); }, 250);
            if (box.classList.contains('revealed')) return;
            box.classList.add('revealed');
        }
    });
}

function jump() {
    if (isJumping) return;
    isJumping = true;
    boxHitThisJump = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
    let velocity = window.innerHeight < 700 ? 18 : 14;
    let gravity = 1;
    let position = 0;
    let maxJump = Infinity;
    const mario = document.getElementById('mario');
    const marioRect = mario.getBoundingClientRect();
    document.querySelectorAll('.box').forEach(box => {
        const boxRect = box.getBoundingClientRect();
        const horizontalHit =
            marioRect.right > boxRect.left &&
            marioRect.left < boxRect.right;
        if (horizontalHit && boxRect.bottom < marioRect.top) {
            const distance = marioRect.top - boxRect.bottom;
            maxJump = Math.min(maxJump, distance);
        }
    });
    jumpInterval = setInterval(() => {
        velocity -= gravity;
        position += velocity;
        if (position > maxJump) {
            position = maxJump;
            velocity = 0;
        }
        if (position <= 0 && velocity < 0) {
            position = 0;
            clearInterval(jumpInterval);
            jumpInterval = null;
            isJumping = false;
        }
        const marioRect = mario.getBoundingClientRect();
        hitBoxesDuringJump(marioRect);
        renderMario(position);
    }, 21);
}

function checkPoleHit() {
    const pole = document.getElementById('end-pole');
    if (!pole) return;
    if (direction !== 'right') return;
    const mario = document.getElementById('mario');
    const m = mario.getBoundingClientRect();
    const p = pole.getBoundingClientRect();
    const hitFromRight =
        m.left <= p.right &&
        m.right > p.left &&
        m.bottom > p.top &&
        m.top < p.bottom;
    if (hitFromRight) finishLevel();
}

let flagActive = false;

function finishLevel() {
    if (flagActive) return;
    flagActive = true;
    flagSound.currentTime = 0;
    flagSound.play();
    const flag = document.querySelector('#end-pole .flag');
    if (!flag) return;
    flag.style.transition = 'top 0.6s';
    // Dynamically calculate drop so flag stops at floor, not below it
    const poleHeight = document.getElementById('end-pole').offsetHeight;
    flag.style.top = (poleHeight - 80) + 'px';
    setTimeout(() => {
        flag.style.transition = 'none';
        flag.style.top = '0px';
        flagActive = false;
    }, 1200);
}

const randomizeInterval = setInterval(() => {
    const unrevealed = document.querySelectorAll('.box:not(.revealed)');
    if (unrevealed.length === 0) {
        clearInterval(randomizeInterval);
        return;
    }
    unrevealed.forEach(box => {
        const placeholder = box.querySelector('.box-placeholder');
        if (!placeholder) return;
        const boxWidth = box.clientWidth;
        const boxHeight = box.clientHeight;
        const textWidth = placeholder.offsetWidth;
        const textHeight = placeholder.offsetHeight;
        const maxX = Math.max(0, boxWidth - textWidth);
        const maxY = Math.max(0, boxHeight - textHeight);
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;
        placeholder.style.transform = `translate(${x}px, ${y}px)`;
    });
}, 900);

function positionBoxesLandscape() {
    if (window.innerHeight > 500 || window.innerWidth < window.innerHeight) {
        // Reset styles when going back to portrait
        document.querySelectorAll('.box').forEach(box => {
            box.style.position = '';
            box.style.float = '';
            box.style.top = '';
            box.style.left = '';
            box.style.marginTop = '';
            box.style.width = '';
            box.style.minHeight = '';
            box.style.height = '';
            box.style.maxHeight = '';
            box.style.overflowY = '';
            box.style.padding = '';
        });
        return;
    }

    const boxes = document.querySelectorAll('.box');
    let xPos = 80;
    const yPos = window.innerHeight * 0.08;
    const boxHeight = window.innerHeight - 70 - yPos - 20;

    boxes.forEach(box => {
        box.style.position = 'absolute';
        box.style.float = 'none';
        box.style.top = yPos + 'px';
        box.style.left = xPos + 'px';
        box.style.marginTop = '0';
        box.style.width = '150px';
        box.style.minHeight = '0';
        box.style.height = boxHeight + 'px';
        box.style.maxHeight = boxHeight + 'px';
        box.style.overflowY = 'auto';
        box.style.padding = '10px';
        xPos += 220;
    });
}

positionBoxesLandscape();
window.addEventListener('resize', positionBoxesLandscape);
window.addEventListener('orientationchange', () => {
    setTimeout(positionBoxesLandscape, 300);
});

$(function () {
    $('body').attr('tabindex', '-1').focus();

    $("body").keydown(function (e) {
        if (e.key === 'ArrowLeft') {
            direction = 'left';
            renderMario(0);
            moveLeft();
        } else if (e.key === 'ArrowRight') {
            direction = 'right';
            renderMario(0);
            moveRight();
        } else if (e.key === ' ' || e.key === 'ArrowUp') {
            jump();
        }
    });

    $("body").keyup(function (e) {
        if (e.keyCode == 37 || e.keyCode == 39) stopMove();
    });

    $('#btn_left').on('mousedown touchstart', function () {
        direction = 'left';
        renderMario(0);
        moveLeft();
    });

    $('#btn_right').on('mousedown touchstart', function () {
        direction = 'right';
        renderMario(0);
        moveRight();
    });

    $('#btn_up').on('mousedown touchstart', function () {
        jump();
    });

    $('#btn_left, #btn_right').on('mouseup touchend', function () {
        stopMove();
    });

    $('#music-btn').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const music = document.getElementById("bg_music");
        if (music_play) {
            music.pause();
            music_play = false;
            $(this).text('Music: OFF');
        } else {
            music.volume = 0.4;
            music.play();
            music_play = true;
            $(this).text('Music: ON');
        }
    });

    $(document).on('keydown', function (e) {
        if (e.code === 'Space') e.preventDefault();
    });
});
