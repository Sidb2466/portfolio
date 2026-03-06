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

const jumpSound    = new Audio('public/jump.mp3');
const boxHitSound  = new Audio('public/box-hit.mp3');
const flagSound    = new Audio('public/flag.mp3');
const WORLD_WIDTH  = 4000;

flagSound.volume   = 0.4;
boxHitSound.volume = 0.3;
jumpSound.volume   = 0.3;

if (ismobile) scroll_x -= 170;
else scroll_x -= 240;
$('#scroll').css('left', scroll_x + 'px');

/* ── SINGLE positionElements FUNCTION ── */
function positionElements() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const isPortrait = vw < vh;
    const isLandscapePhone = vh <= 500 && vw > vh;

    // Portrait — let CSS handle everything
    if (isPortrait) {
        document.querySelectorAll('.box').forEach(box => {
            box.style.position  = '';
            box.style.float     = '';
            box.style.top       = '';
            box.style.left      = '';
            box.style.marginTop = '';
            box.style.width     = '';
            box.style.minHeight = '';
            box.style.height    = '';
            box.style.maxHeight = '';
            box.style.overflowY = '';
            box.style.padding   = '';
        });
        const pole = document.getElementById('end-pole');
        if (pole) pole.style.height = '';
        return;
    }

    // Landscape phone — rotate message covers screen, do nothing
    if (isLandscapePhone) return;

    // Desktop/laptop — position boxes dynamically based on screen height
    const floorH   = 106;
    const marioTop = vh - floorH - 129;
    const jumpReach = vh < 600 ? 160
                    : vh < 700 ? 150
                    : vh < 900 ? 130
                    : 120;
    const boxBottom = marioTop - jumpReach + 30;
    const boxHeight = Math.max(150, boxBottom - 40);
    const boxTop    = boxBottom - boxHeight;

    document.querySelectorAll('.box').forEach(box => {
        box.style.position  = 'absolute';
        box.style.float     = 'none';
        box.style.top       = boxTop + 'px';
        box.style.marginTop = '0';
        box.style.height    = boxHeight + 'px';
        box.style.minHeight = boxHeight + 'px';
        box.style.maxHeight = boxHeight + 'px';
        box.style.overflowY = 'auto';
        box.style.width     = '280px';
    });

    const pole = document.getElementById('end-pole');
    if (pole) pole.style.height = (vh - floorH - 20) + 'px';
}

positionElements();
window.addEventListener('resize', positionElements);
window.addEventListener('orientationchange', () => setTimeout(positionElements, 300));

/* ── RENDERING ── */
function renderMario(yOffset = 0) {
    const scale = direction === 'left' ? -1 : 1;
    const mario = document.getElementById('mario');
    mario.style.transform = `translateY(${-yOffset}px) scaleX(${scale})`;
}

/* ── MOVEMENT ── */
function moveTo(pos) {
    let diff = ismobile ? 14 : 22;
    checkPoleHit();
    if (pos === 'left') {
        floor_x += diff;
        scroll_x += diff;
        mario_x  -= 65;
        if (mario_x === -195) mario_x = 0;
    } else if (pos === 'right') {
        floor_x -= diff;
        scroll_x -= diff;
        mario_x  -= 65;
        if (mario_x === -195) mario_x = 0;
    }
    if (scroll_x < -WORLD_WIDTH) scroll_x = $(window).width();
    else if (scroll_x > $(window).width()) scroll_x = -WORLD_WIDTH;

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
    if (!interval_left) interval_left = setInterval(() => moveTo('left'), 60);
}

function moveRight() {
    playMusic();
    if (!interval_right) interval_right = setInterval(() => moveTo('right'), 60);
}

function stopMove() {
    clearInterval(interval_left);
    clearInterval(interval_right);
    interval_left = false;
    interval_right = false;
}

/* ── JUMP ── */
function hitBoxesDuringJump(marioRect) {
    if (boxHitThisJump) return;
    document.querySelectorAll('.box').forEach(box => {
        const boxRect = box.getBoundingClientRect();
        const horizontalHit =
            marioRect.right  > boxRect.left  + 10 &&
            marioRect.left   < boxRect.right - 10;
        const verticalHit =
            marioRect.top   <= boxRect.bottom + 5 &&
            marioRect.top   >= boxRect.bottom - 30;
        if (horizontalHit && verticalHit) {
            boxHitThisJump = true;
            box.classList.add('hit');
            boxHitSound.currentTime = 0;
            boxHitSound.play();
            setTimeout(() => box.classList.remove('hit'), 250);
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

    const vh = window.innerHeight;
    let velocity = vh < 600 ? 20
                 : vh < 700 ? 18
                 : vh < 900 ? 16
                 : 14;

    let gravity  = 1;
    let position = 0;
    let maxJump  = Infinity;

    const mario     = document.getElementById('mario');
    const marioRect = mario.getBoundingClientRect();

    document.querySelectorAll('.box').forEach(box => {
        const boxRect = box.getBoundingClientRect();
        const horizontalHit =
            marioRect.right > boxRect.left &&
            marioRect.left  < boxRect.right;
        if (horizontalHit && boxRect.bottom < marioRect.top) {
            const distance = marioRect.top - boxRect.bottom;
            maxJump = Math.min(maxJump, distance);
        }
    });

    jumpInterval = setInterval(() => {
        velocity -= gravity;
        position += velocity;
        if (position > maxJump) { position = maxJump; velocity = 0; }
        if (position <= 0 && velocity < 0) {
            position = 0;
            clearInterval(jumpInterval);
            jumpInterval = null;
            isJumping = false;
        }
        hitBoxesDuringJump(mario.getBoundingClientRect());
        renderMario(position);
    }, 21);
}

/* ── FLAG / POLE ── */
function checkPoleHit() {
    const pole = document.getElementById('end-pole');
    if (!pole || direction !== 'right') return;
    const m = document.getElementById('mario').getBoundingClientRect();
    const p = pole.getBoundingClientRect();
    if (m.left <= p.right && m.right > p.left && m.bottom > p.top && m.top < p.bottom) {
        finishLevel();
    }
}

let flagActive = false;

function finishLevel() {
    if (flagActive) return;
    flagActive = true;
    flagSound.currentTime = 0;
    flagSound.play();
    const flag = document.querySelector('#end-pole .flag');
    if (!flag) return;
    const poleHeight = document.getElementById('end-pole').offsetHeight;
    flag.style.transition = 'top 0.6s';
    flag.style.top = (poleHeight - 80) + 'px';
    setTimeout(() => {
        flag.style.transition = 'none';
        flag.style.top = '0px';
        flagActive = false;
    }, 1200);
}

/* ── HIT ME ANIMATION ── */
const randomizeInterval = setInterval(() => {
    const unrevealed = document.querySelectorAll('.box:not(.revealed)');
    if (unrevealed.length === 0) { clearInterval(randomizeInterval); return; }
    unrevealed.forEach(box => {
        const placeholder = box.querySelector('.box-placeholder');
        if (!placeholder) return;
        const maxX = Math.max(0, box.clientWidth  - placeholder.offsetWidth);
        const maxY = Math.max(0, box.clientHeight - placeholder.offsetHeight);
        placeholder.style.transform = `translate(${Math.random() * maxX}px, ${Math.random() * maxY}px)`;
    });
}, 900);

/* ── CONTROLS ── */
$(function () {
    $('body').attr('tabindex', '-1').focus();

    $("body").keydown(function (e) {
        if      (e.key === 'ArrowLeft')                { direction = 'left';  renderMario(0); moveLeft(); }
        else if (e.key === 'ArrowRight')               { direction = 'right'; renderMario(0); moveRight(); }
        else if (e.key === ' ' || e.key === 'ArrowUp') { jump(); }
    });

    $("body").keyup(function (e) {
        if (e.keyCode === 37 || e.keyCode === 39) stopMove();
    });

    $('#btn_left').on('mousedown touchstart',  () => { direction = 'left';  renderMario(0); moveLeft(); });
    $('#btn_right').on('mousedown touchstart', () => { direction = 'right'; renderMario(0); moveRight(); });
    $('#btn_up').on('mousedown touchstart',    () => jump());
    $('#btn_left, #btn_right').on('mouseup touchend', stopMove);

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

    $(document).on('keydown', e => { if (e.code === 'Space') e.preventDefault(); });
});
