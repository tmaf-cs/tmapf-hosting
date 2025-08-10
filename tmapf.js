// ==UserScript==
// @name         티매프 2025
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @description  좌석 선택 후 결제창 전환 감지하여 즉시 중단
// @match        *://*.interpark.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const USER_SETTINGS = {
        SEAT_SELECTION_OPTION: 2, // 1: 왼쪽, 2: 가운데, 3: 오른쪽
        NEXT_BUTTON_DELAY: 10,
        SEAT_CHECK_INTERVAL: 50,
        TIMEOUT_DURATION: 6000000,
        MAX_SEAT_ATTEMPTS: 6000000
    };

    function clickElement(element) {
        if (element) {
            element.focus();
            element.click();
            console.log(`Clicked element: ${element.id || element.tagName}`);
            return true;
        }
        return false;
    }

    function findSeatsAfterRow(row) {
        let currentElement = row.nextElementSibling;
        const seatsInRow = [];
        while (currentElement && !currentElement.classList.contains('SeatT')) {
            if (currentElement.id === 'Seats') {
                seatsInRow.push(currentElement);
            }
            currentElement = currentElement.nextElementSibling;
        }
        return seatsInRow;
    }

    function selectSeatsByPreference(seatsInRow) {
        switch (USER_SETTINGS.SEAT_SELECTION_OPTION) {
            case 1: return seatsInRow[0];
            case 2: return seatsInRow[Math.floor(seatsInRow.length / 2)];
            case 3: return seatsInRow[seatsInRow.length - 1];
            default: return seatsInRow[0];
        }
    }

    function findAndClickSeats(detailDoc) {
        const rows = detailDoc.querySelectorAll('.SeatT');
        for (let row of rows) {
            const seatsInRow = findSeatsAfterRow(row);
            if (seatsInRow.length > 0) {
                const seatToClick = selectSeatsByPreference(seatsInRow);
                if (seatToClick) {
                    return clickElement(seatToClick);
                }
            }
        }
        return false;
    }

    function clickNextStepButton(iframeDoc) {
        const nextStepButton = iframeDoc.querySelector('a[href="javascript:fnSelect();"]');
        if (nextStepButton) {
            setTimeout(() => {
                nextStepButton.click();
                console.log('Next step button clicked.');
            }, USER_SETTINGS.NEXT_BUTTON_DELAY);
        }
    }

    // 결제창 전환 감지 (.contL::after)
    function hasAfterInIframe() {
        const iframe = document.getElementById('ifrmBookStep');
        if (!iframe) return false;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return false;
        const contL = iframeDoc.querySelector('.contL');
        if (!contL) return false;
        const afterContent = iframe.contentWindow.getComputedStyle(contL, '::after').content;
        return afterContent && afterContent !== 'none';
    }

    function processSeatSelection(iframeDoc) {
        const detailIframe = iframeDoc.getElementById('ifrmSeatDetail');
        if (!detailIframe) return false;
        const detailDoc = detailIframe.contentDocument || detailIframe.contentWindow.document;
        if (!detailDoc) return false;
        if (findAndClickSeats(detailDoc)) {
            setTimeout(() => {
                clickNextStepButton(iframeDoc);
            }, USER_SETTINGS.NEXT_BUTTON_DELAY);
            return true;
        }
        return false;
    }

    function monitorForSeatSelection() {
        console.log('Monitoring for iframe and seat selection.');
        const observer = new MutationObserver(() => {
            const iframe = document.getElementById('ifrmSeat');
            if (iframe) {
                iframe.addEventListener('load', function () {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc) return;
                    const captchaInput = iframeDoc.getElementById('txtCaptcha');

                    // 캡차가 있으면 클릭 후 대기
                    if (captchaInput) {
                        console.log('Captcha input field found.');
                        clickElement(captchaInput);
                        console.log('Waiting for user to enter captcha...');
                        const seatCheckInterval = startSeatCheckInterval(iframeDoc);
                        setTimeout(() => {
                            clearInterval(seatCheckInterval);
                            console.log(`Seat checking timed out after ${USER_SETTINGS.TIMEOUT_DURATION / 1000} seconds.`);
                        }, USER_SETTINGS.TIMEOUT_DURATION);
                    } else {
                        // 캡차 없으면 바로 진행
                        console.log('No captcha found, proceeding directly to seat selection.');
                        const seatCheckInterval = startSeatCheckInterval(iframeDoc);
                        setTimeout(() => {
                            clearInterval(seatCheckInterval);
                            console.log(`Seat checking timed out after ${USER_SETTINGS.TIMEOUT_DURATION / 1000} seconds.`);
                        }, USER_SETTINGS.TIMEOUT_DURATION);
                    }
                });
            }
        });

        function startSeatCheckInterval(iframeDoc) {
            let attempts = 0;
            const seatCheckInterval = setInterval(() => {
                attempts++;

                // 여기서 결제창 전환 감지
                if (hasAfterInIframe()) {
                    console.log("::after 감지됨 → 결제창 진입 → 좌석 탐색 중단");
                    clearInterval(seatCheckInterval);
                    observer.disconnect();
                    return;
                }

                if (processSeatSelection(iframeDoc) || attempts >= USER_SETTINGS.MAX_SEAT_ATTEMPTS) {
                    console.log(`Seat selection ${attempts >= USER_SETTINGS.MAX_SEAT_ATTEMPTS ? 'timed out' : 'completed'}.`);
                    clearInterval(seatCheckInterval);
                    observer.disconnect();
                }
            }, USER_SETTINGS.SEAT_CHECK_INTERVAL);
            return seatCheckInterval;
        }

        observer.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('load', monitorForSeatSelection);
})();