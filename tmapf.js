(function(){
  // ======= 설정: 내 Apps Script 웹앱 URL로 바꿔라 =======
  var GAS_URL = 'https://script.google.com/macros/s/AKfycbx9iBei2UC1lHZZ9UPBjdQa2JLrAVZB39YXYo7FSSLJLf0cIqevoMufSLq14RWKPQXPdw/exec';
  // ===================================================

  // (1) 먼저 전역으로 Tampermonkey Loader가 설정해둔 값 확인
  var accessCode = window.__TMAPF_ACCESS_CODE || null;

  // (2) current script src의 쿼리파라미터에서 accessCode 추출 시도
  try {
    var curr = (document.currentScript && document.currentScript.src) || '';
    if (!accessCode && curr) {
      var u = new URL(curr);
      accessCode = u.searchParams.get('accessCode') || accessCode;
    }
  } catch (e) {
    /* ignore */
  }

  // (3) 아직 없으면 사용자에게 prompt로 입력하게 해도 됨
  if (!accessCode) {
    accessCode = prompt('TMAPF 액세스 코드를 입력하세요:');
  }

  if (!accessCode) {
    console.warn('tmapf: no access code provided — abort');
    return;
  }

  // (4) Apps Script에서 실제 메인 스크립트를 내려받아 실행시키기
  var s = document.createElement('script');
  s.src = GAS_URL + '?accessCode=' + encodeURIComponent(accessCode);
  s.async = false; // 동기적 로딩 원하면 false
  document.head.appendChild(s);
})();
