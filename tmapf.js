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
  // (3) 액세스 코드가 없으면 콘솔 로그 띄우고 종료
  if (!accessCode) {
    console.log('tmapf: 액세스 코드가 제공되지 않았습니다. Tampermonkey 로더를 확인하세요.');
    return;
  }
  
  console.log('tmapf: 액세스 코드 확인됨, 메인 스크립트 로딩 중...');
  // (4) Apps Script에서 실제 메인 스크립트를 내려받아 실행시키기
  var s = document.createElement('script');
  s.src = GAS_URL + '?accessCode=' + encodeURIComponent(accessCode);
  s.async = false; // 동기적 로딩 원하면 false
  s.onload = function() {
    console.log('tmapf: 메인 스크립트 로딩 완료');
  };
  s.onerror = function() {
    console.error('tmapf: 메인 스크립트 로딩 실패');
  };
  document.head.appendChild(s);
})();
