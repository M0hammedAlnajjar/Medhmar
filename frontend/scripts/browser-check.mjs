import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const port = 5599;
const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, FRONTEND_PORT: String(port) }, stdio: ['ignore','pipe','pipe'] });
let output = ''; server.stdout.on('data', chunk => output += chunk); server.stderr.on('data', chunk => output += chunk);
let browser;
try {
  let ready = false;
  for (let i=0;i<100;i++) {
    if (server.exitCode !== null) throw new Error(`Preview server stopped: ${output}`);
    try { const r = await fetch(`http://localhost:${port}/`); if (r.ok) { ready=true;break; } } catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready, `Preview server did not start: ${output}`);
  browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport: {width:1440,height:1100} });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const mutations = [];
  page.on('request', request => { if (request.url().includes(':8080') && request.method() !== 'GET') mutations.push(request.url()); });
  let marketHasListings = false;
  let recordedChallengeVotes = 0;
  await page.route('**/*:8080/**', route => {
    const path = new URL(route.request().url()).pathname;
    const liveChallenge = {
      challengeId:42,title:'Test Live Racing Challenge',status:'OPEN',creatorId:5,
      opensAt:new Date(Date.now()-86400000).toISOString(),
      closesAt:new Date(Date.now()+86400000).toISOString(),
      totalVotes:recordedChallengeVotes,
      camels:[
        {camelId:1,name:'Al Barq',voteCount:recordedChallengeVotes,votePercent:recordedChallengeVotes?100:0,photoUrl:null},
        {camelId:2,name:'Shaheen',voteCount:0,votePercent:0,photoUrl:null}
      ]
    };
    if (path === '/api/auth/csrf') return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({headerName:'X-XSRF-TOKEN',token:'browser-test-token'})});
    if (path === '/api/challenges/42/votes' && route.request().method()==='POST') {
      recordedChallengeVotes+=1;
      return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({voteId:9,challengeId:42,camelId:1})});
    }
    if (path === '/api/challenges/42') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(liveChallenge)});
    if (path === '/api/challenges') return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({content:[liveChallenge,{
        challengeId:41,title:'Recorded Heritage Challenge',status:'CLOSED',
        opensAt:'2026-01-01T06:00:00Z',closesAt:'2026-01-02T06:00:00Z',
        totalVotes:3,camels:[
          {camelId:7,name:'Sahm',voteCount:2,votePercent:66.67,photoUrl:'/assets/mock-camels/camel-7.jpg'},
          {camelId:8,name:'Hamdan',voteCount:1,votePercent:33.33,photoUrl:null}
        ]
      }],page:0,size:20,totalElements:2,totalPages:1})});
    if (path === '/marketplace/getAll') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:marketHasListings?[{listingId:77,camelId:41,askingPriceOmr:'4000.125',status:'AVAILABLE'}]:[],page:0,totalPages:1,totalElements:marketHasListings?1:0})});
    if (path === '/camel/getById') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({camelId:41,name:'Recorded camel',breed:'Omani',gender:'MALE',birthDate:'2022-01-01',photoUrl:'/assets/marketplace-photos/wahiba-close.webp'})});
    if (path === '/camel/getAll') {
      const search = new URL(route.request().url()).searchParams.get('search');
      const content = !search || search === 'Barq' ? [{camelId:41,name:'Barq',breed:'Omani',gender:'MALE',status:'ACTIVE'}] : [];
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content,page:0,totalPages:1,totalElements:content.length})});
    }
    if (path === '/camel/41/pedigree/tree') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({camelId:41,name:'Barq',sireName:'Al Zaeem',damName:'Bint Al Reem'})});
    if (path === '/trainer-profile/active') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
      {userId:22,trainerName:'Mohammed Alnajjar',bio:'Experienced camel trainer',location:'Muscat',avatarUrl:null},
      {userId:23,trainerName:'Salim Al Rashidi',bio:'Trainer profile details',location:'Nizwa',avatarUrl:null}
    ])});    const data = path === '/api/users/me'  ? {userId:22,fullName:'Mohammed Alnajjar',roles:['TRAINER']} : [];
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await mkdir('test-results',{recursive:true});
  // Authentication header uses the gold transparent mark directly on brown.
  await page.goto('http://localhost:'+port+'/signin');
  await page.locator('.auth-brandbar .brand-wordmark').waitFor();
  const authLogoStyle=await page.locator('.auth-brandbar .brand-wordmark').evaluate(el=>{
    const css=getComputedStyle(el);
    return {background:css.backgroundColor,border:css.borderTopWidth,shadow:css.boxShadow};
  });
  assert.equal(authLogoStyle.background,'rgba(0, 0, 0, 0)','auth logo must have no white background');
  assert.equal(authLogoStyle.border,'0px','auth logo must have no border');
  assert.equal(authLogoStyle.shadow,'none','auth logo must not have a shadow');
  assert.ok(await page.locator('.auth-brandbar .brand-wordmark img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:'test-results/auth-logo-transparent-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.auth-brandbar .brand-wordmark').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.screenshot({path:'test-results/auth-logo-transparent-mobile.png'});
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`http://localhost:${port}/challenges`);
  await page.locator('.broadcast-live-data').waitFor();
  assert.match(await page.locator('.broadcast-heading h1').innerText(),/Test Live Racing Challenge/);
  assert.equal(await page.locator('.broadcast-candidate').count(),2);
  assert.equal(await page.locator('.broadcast-grid').count(),1);
  assert.equal(await page.locator('.broadcast-published-card').count(),1);
  assert.equal(await page.locator('.broadcast-published-placeholder').count(),1);
  assert.match(await page.locator('.broadcast-published-placeholder').innerText(),/Only real challenge results/);
  assert.equal(await page.locator('.broadcast-placeholder-landscape').count(),1,'placeholder uses inline mountain SVG');
  assert.equal(await page.locator('.broadcast-placeholder-flag').count(),1,'reference flag icon renders');
  const landscapeVisual=await page.locator('.broadcast-published-placeholder').evaluate(el=>({
    artwork:el.querySelector('.broadcast-placeholder-landscape')?.getBoundingClientRect().width,
    background:getComputedStyle(el).backgroundImage
  }));
  assert.ok(landscapeVisual.artwork>100,'inline illustration must have nonzero dimensions');
  assert.ok(!landscapeVisual.background.includes('url('),'placeholder must not download a photo');
  // Regress the wide, shallow banner that previously cropped the SVG with `slice`.
  for (const width of [1920,1440,970,660,390,320]) {
    await page.setViewportSize({width,height:900});
    const geometry=await page.locator('.broadcast-published-placeholder').evaluate(el=>{
      const banner=el.getBoundingClientRect();
      const svg=el.querySelector('.broadcast-placeholder-landscape');
      const art=svg.getBBox(),matrix=svg.getScreenCTM();
      const corners=[new DOMPoint(art.x,art.y),new DOMPoint(art.x+art.width,art.y+art.height)]
        .map(point=>point.matrixTransform(matrix));
      const copy=el.querySelector('.broadcast-placeholder-copy').getBoundingClientRect();
      return {
        artFits:corners.every(point=>point.x>=banner.left-1&&point.x<=banner.right+1
          &&point.y>=banner.top-1&&point.y<=banner.bottom+1),
        copyFits:copy.left>=banner.left&&copy.right<=banner.right+1
          &&copy.top>=banner.top&&copy.bottom<=banner.bottom+1,
        overflow:document.documentElement.scrollWidth>innerWidth+1
      };
    });
    assert.ok(geometry.artFits,`mountains and palms must be fully visible at ${width}px`);
    assert.ok(geometry.copyFits,`placeholder copy must stay inside the banner at ${width}px`);
    assert.ok(!geometry.overflow,`challenge page must not scroll horizontally at ${width}px`);
  }
  await page.setViewportSize({width:1440,height:900});
  assert.match(await page.locator('.broadcast-published-card').innerText(),/Recorded Heritage Challenge|Sahm/);
  assert.doesNotMatch(await page.locator('.broadcast-preview').innerText(),/Desert Speed Challenge|Winter Racing Cup/);
  const desktopCols=await page.locator('.broadcast-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert.equal(desktopCols,2,'desktop challenges must have hero and voting columns');
  const imageBefore=await page.locator('.broadcast-scene-image').getAttribute('src');
  await page.locator('[data-preview-image="next"]').click();
  assert.notEqual(await page.locator('.broadcast-scene-image').getAttribute('src'),imageBefore);
  await page.locator('[data-preview-image="prev"]').click();
  assert.equal(await page.locator('.broadcast-scene-image').getAttribute('src'),imageBefore);
  await page.locator('[data-preview-tab="results"]').click();
  assert.match(await page.locator('#broadcast-info').innerText(),/Al Barq|Shaheen/);
  assert.match(await page.locator('.broadcast-voting').innerText(),/Al Barq|Shaheen/);
  assert.match(await page.locator('.broadcast-voting').innerText(),/0 votes/);
  assert.doesNotMatch(await page.locator('.broadcast-preview').innerText(),/744 votes|456 votes|1.2K watching|LIVE PREVIEW|Sample event/);
  await page.locator('[data-preview-tab="participants"]').click();
  assert.match(await page.locator('#broadcast-info').innerText(),/Shaheen/);
  await page.locator('.broadcast-candidate .vote-btn').first().click();
  await page.waitForFunction(()=>document.querySelector('.broadcast-voting')?.innerText.includes('1 votes'));
  assert.equal(recordedChallengeVotes,1,'real featured vote must call backend');
  assert.equal(mutations.filter(path=>path.includes('/api/challenges/42/votes')).length,1);
  mutations.length=0;
  await page.locator('#refresh-challenges').click();
  await page.waitForFunction(()=>document.querySelector('.broadcast-voting')?.innerText.includes('1 votes'));
  await page.setViewportSize({width:1920,height:1080});
  const desktopReferenceGeometry=await page.evaluate(()=>{
    const grid=document.querySelector('.broadcast-grid').getBoundingClientRect();
    const hero=document.querySelector('.broadcast-player').getBoundingClientRect();
    const voting=document.querySelector('.broadcast-voting').getBoundingClientRect();
    return {viewport:innerWidth,gridWidth:grid.width,left:grid.left,
      heroWidth:hero.width,votingWidth:voting.width,overflow:document.documentElement.scrollWidth};
  });
  assert.ok(desktopReferenceGeometry.gridWidth>=desktopReferenceGeometry.viewport*.85,
    'Challenges reference must use at least 85% of widescreen: '+JSON.stringify(desktopReferenceGeometry));
  assert.ok(desktopReferenceGeometry.left<120,
    'Challenges left gutter should match reference spacing: '+JSON.stringify(desktopReferenceGeometry));
  assert.ok(desktopReferenceGeometry.heroWidth>=desktopReferenceGeometry.votingWidth*1.95,
    'Reference hero must be substantially wider than voting panel: '+JSON.stringify(desktopReferenceGeometry));
  assert.ok(desktopReferenceGeometry.overflow<=desktopReferenceGeometry.viewport+1,
    'Challenges widescreen must not overflow: '+JSON.stringify(desktopReferenceGeometry));
  await page.screenshot({path:'test-results/challenges-desktop.png',fullPage:true});
  // The public Challenges content can be wide, but its navbar must be identical to Home.
  const headerBounds=()=>page.evaluate(()=>{
    const selectors=['.topbar','.topbar-inner','.brand-wordmark','.nav-desktop','.nav-actions'];
    return Object.fromEntries(selectors.map(selector=>{
      const box=document.querySelector(selector)?.getBoundingClientRect();
      return [selector,box?{x:box.x,y:box.y,width:box.width,height:box.height}:null];
    }));
  });
  const challengeHeaderDesktop=await headerBounds();
  await page.goto('http://127.0.0.1:'+port+'/home');
  await page.locator('.topbar-inner').waitFor();
  const homeHeaderDesktop=await headerBounds();
  for(const selector of Object.keys(homeHeaderDesktop))for(const key of ['x','y','width','height']){
    assert.ok(Math.abs(challengeHeaderDesktop[selector][key]-homeHeaderDesktop[selector][key])<1.1,
      'Challenges navbar must match Home at 1920px: '+selector+'.'+key+
      ' '+challengeHeaderDesktop[selector][key]+' vs '+homeHeaderDesktop[selector][key]);
  }
  await page.goto('http://127.0.0.1:'+port+'/challenges');
  await page.locator('.broadcast-live-data').waitFor();

  // 1920px monitors at 125% desktop scaling often expose ~1536 CSS px.
  // This viewport previously let the header approach the screen edges.
  await page.setViewportSize({width:1536,height:900});
  const scaledChallengesHeader=await headerBounds();
  const scaledContainer=scaledChallengesHeader['.topbar-inner'];
  assert.ok(scaledContainer.x>=90 && scaledContainer.width<=1310,
    'scaled desktop navbar should be centered: '+JSON.stringify(scaledContainer));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),
    'scaled Challenges desktop must not overflow');
  await page.screenshot({path:'test-results/challenges-navbar-scaled-desktop.png'});
  await page.goto('http://127.0.0.1:'+port+'/home');
  await page.locator('.topbar-inner').waitFor();
  const scaledHomeHeader=await headerBounds();
  for(const selector of Object.keys(scaledHomeHeader))for(const key of ['x','y','width','height']){
    assert.ok(Math.abs(scaledChallengesHeader[selector][key]-scaledHomeHeader[selector][key])<1.1,
      'scaled desktop mismatch between Home and Challenges: '+selector+'.'+key);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),
    'scaled Home desktop must not overflow');
  await page.screenshot({path:'test-results/home-navbar-scaled-desktop.png'});
  await page.goto('http://127.0.0.1:'+port+'/challenges');
  await page.locator('.broadcast-live-data').waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.broadcast-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
  const mobileLayout=await page.evaluate(()=>({
    viewport:innerWidth,document:document.documentElement.scrollWidth,
    overflow:[...document.querySelectorAll('body *')].filter(el=>{
      const box=el.getBoundingClientRect();
      return box.width>0&&(box.right>innerWidth+2||box.left<-2);
    }).slice(0,12).map(el=>({
      tag:el.tagName,cls:typeof el.className==='string'?el.className:'',width:el.getBoundingClientRect().width,
      right:el.getBoundingClientRect().right,left:el.getBoundingClientRect().left
    }))
  }));
  assert.ok(mobileLayout.document<=mobileLayout.viewport+1,'live challenges mobile must not overflow: '+JSON.stringify(mobileLayout));
  await page.screenshot({path:'test-results/challenges-mobile.png',fullPage:true});
  const challengeHeaderMobile=await headerBounds();
  await page.goto('http://127.0.0.1:'+port+'/home');
  await page.locator('.topbar-inner').waitFor();
  const homeHeaderMobile=await headerBounds();
  for(const selector of Object.keys(homeHeaderMobile))for(const key of ['x','y','width','height']){
    assert.ok(Math.abs(challengeHeaderMobile[selector][key]-homeHeaderMobile[selector][key])<1.1,
      'Challenges navbar must match Home at 390px: '+selector+'.'+key+
      ' '+challengeHeaderMobile[selector][key]+' vs '+homeHeaderMobile[selector][key]);
  }

  await page.setViewportSize({width:1440,height:900});
  await page.goto(`http://localhost:${port}/training`);
  await page.locator('.training-journal').waitFor();
  assert.equal(await page.locator('.journal-session').count(),3);
  await page.locator('[data-journal-session="1"]').click();
  assert.equal(await page.locator('#journal-dialog').evaluate(dialog=>dialog.open),true);
  await page.locator('#journal-dialog button').click();
  await page.locator('#journal-month').selectOption('2026-09');
  assert.equal(await page.locator('.journal-session').count(),0);
  await page.locator('#journal-month').selectOption('2026-10');
  assert.equal(await page.locator('.journal-session').count(),3);
  await page.locator('#add-training-btn').click();
  await page.locator('#training-form').waitFor();
  await page.locator('#close-modal').click();
  assert.equal(mutations.length,0,'preview controls must not submit account data');
  await page.screenshot({path:'test-results/training-desktop.png',fullPage:true});
  await page.goto(`http://localhost:${port}/organizations`);
  await page.locator('.directory-card').first().waitFor();
  assert.equal(await page.locator('.directory-card').count(),3);
  await page.locator('#organization-search').fill('nizwa');
  assert.equal(await page.locator('.directory-card').count(),1);
  await page.locator('[data-organization="2"]').click();
  assert.equal(await page.locator('.directory-dialog').evaluate(d=>d.open),true);
  await page.keyboard.press('Escape');
  await page.locator('#organization-region').selectOption('Dhofar');
  assert.equal(await page.locator('.directory-card').count(),0);
  await page.locator('#organization-search').fill('');
  assert.equal(await page.locator('.directory-card').count(),1);
  await page.locator('#organization-region').selectOption('');
  await page.locator('[data-event="1"]').click();
  assert.match(await page.locator('.directory-dialog-body').innerText(), /Illustrative event/);
  await page.keyboard.press('Escape');
  assert.equal(mutations.length,0,'directory preview must not write to the backend');
  await page.screenshot({path:'test-results/organizations-desktop.png',fullPage:true});

  await page.goto(`http://localhost:${port}/tourism`);
  await page.locator('.heritage-card').first().waitFor();
  assert.equal(await page.locator('.heritage-card').count(),3);
  assert.equal(await page.locator('.tourism-hero').count(),0);
  assert.ok(await page.locator('.heritage-card > img').evaluateAll(images=>images.every(i=>i.complete && i.naturalWidth>0)), 'heritage photographs must load');
  await page.locator('[data-heritage-category="stories"]').click();
  assert.equal(await page.locator('.heritage-card').count(),2);
  await page.locator('#heritage-search').fill('Adam');
  assert.equal(await page.locator('.heritage-card').count(),0);
  await page.locator('[data-heritage-category="events"]').click();
  assert.equal(await page.locator('.heritage-card').count(),1);
  await page.locator('[data-heritage-item="2"]').click();
  assert.equal(await page.locator('.heritage-dialog').evaluate(d=>d.open),true);
  await page.keyboard.press('Escape');
  await page.locator('#heritage-search').fill('');
  await page.locator('[data-heritage-category="all"]').click();
  assert.equal(mutations.length,0,'heritage sample actions must not write to backend');
  await page.screenshot({path:'test-results/heritage-desktop.png',fullPage:true});

  await page.goto(`http://localhost:${port}/races`);
  await page.locator('.medhmar-race-row').first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.medhmar-race-image img')].every(i=>i.complete && i.naturalWidth>0));
  const raceSources=await page.locator('.medhmar-race-image img').evaluateAll(images=>images.map(i=>i.getAttribute('src')));
  assert.equal(new Set(raceSources).size,3,'upcoming races use three different real photographs');
  assert.ok(raceSources.every(src=>src.startsWith('/assets/organization-photos/')));
  await page.screenshot({path:'test-results/races-desktop.png',fullPage:true});

  await page.goto(`http://localhost:${port}/race-cards`);
  await page.locator('.drc-document').waitFor();
  assert.equal(await page.locator('.drc-table tbody tr').count(),4);
  await page.locator('#drc-version').selectOption('1');
  assert.equal(await page.locator('.drc-table tbody tr').count(),3);
  await page.locator('[data-drc-version="2"]').click();
  assert.equal(await page.locator('#drc-version').inputValue(),'2');
  assert.equal(await page.locator('.drc-table tbody tr').count(),4);
  await page.locator('#drc-race').selectOption('nizwa');
  assert.equal(await page.locator('.drc-table tbody tr').count(),2);
  assert.equal(await page.locator('#drc-version option').count(),1);
  await page.locator('#drc-race').selectOption('bashayer');
  await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});
  await page.locator('[data-drc-print]').click();
  assert.equal(await page.evaluate(()=>window.__printCalls),1);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.drc-document').evaluate(el=>getComputedStyle(el).visibility),'visible');
  assert.equal(await page.locator('.drc-toolbar').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await page.locator('.topbar').evaluate(el=>getComputedStyle(el).display),'none');
  await page.screenshot({path:'test-results/race-card-print.png',fullPage:true});
  await page.emulateMedia({media:'screen'});
  assert.equal(mutations.length,0,'viewing sample race card versions must never publish');
  await page.screenshot({path:'test-results/race-cards-desktop.png',fullPage:true});

  await page.goto(`http://localhost:${port}/pedigree`);
  await page.locator('.pedigree-search-form').waitFor();
  await page.locator('[data-pedigree-record]').waitFor();
  assert.match(await page.locator('.pedigree-inline').innerText(), /Al Zaeem/);
  await page.getByRole('link',{name:'Choose another camel'}).click();
  await page.locator('.pedigree-finder-start').waitFor();
  assert.equal(await page.locator('[data-pedigree-record]').count(),0);
  assert.equal(await page.locator('[data-pedigree-placeholder] .pedigree-node').count(),7);
  assert.equal(await page.locator('select[name="gender"]').count(),0);
  await page.locator('#pedigree-search').fill('Barq');
  await page.locator('.pedigree-search-form button').click();
  await page.locator('.pedigree-search-results a').click();
  await page.locator('[data-pedigree-record]').waitFor();
  assert.match(await page.locator('.pedigree-inline').innerText(), /Al Zaeem/);
  assert.equal(await page.locator('h1').count(),1);
  await page.screenshot({path:'test-results/pedigree-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1), 'selected pedigree overflows on mobile');
  await page.screenshot({path:'test-results/pedigree-mobile.png',fullPage:true});
  await page.locator('#pedigree-search').fill('missing');
  await page.locator('.pedigree-search-form button').click();
  await page.getByText('No camels match this name.',{exact:false}).waitFor();
  assert.equal(await page.locator('[data-pedigree-record]').count(),0);
  assert.equal(await page.locator('[data-pedigree-placeholder] .pedigree-node').count(),7);
  await page.screenshot({path:'test-results/pedigree-empty-permanent.png',fullPage:true});
  assert.equal(mutations.length,0,'pedigree search and selection must remain read only');

  await page.goto(`http://localhost:${port}/marketplace`);
  await page.getByText('No live listings are available yet.',{exact:false}).waitFor();
  assert.equal(await page.locator('.market-listing-card').count(),3);
  await page.getByRole('link',{name:'View live marketplace'}).click();
  await page.locator('.market-empty').waitFor();
  assert.equal(await page.locator('[data-market-sample]').count(),0);
  marketHasListings=true;
  await page.goto(`http://localhost:${port}/marketplace?preview=0`);
  await page.locator('.market-listing-card').first().waitFor();
  assert.match(await page.locator('.market-listing-card').innerText(),/Recorded camel/);
  assert.equal(await page.getByRole('link',{name:'View Listing',exact:true}).getAttribute('href'),'/marketplace/77');
  assert.equal(await page.getByRole('link',{name:'View Pedigree',exact:true}).getAttribute('href'),'/pedigree?camel=41');
  assert.equal(await page.locator('[data-market-sample]').count(),0);
  // Preview marketplace is explicit and all its actions remain local.
  await page.setViewportSize({width:1440,height:1100});
  await page.goto(`http://localhost:${port}/marketplace?preview=1`);
  await page.locator('.market-listing-card').first().waitFor();
  assert.equal(await page.locator('.market-listing-card').count(),3);
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-market-photo]')].length===3&&[...document.querySelectorAll('[data-market-photo]')].every(i=>i.complete&&i.naturalWidth>0));
  await page.locator('[data-market-sample="sample-barq"]').click();
  assert.equal(await page.locator('.market-preview-dialog').evaluate(d=>d.open),true);
  assert.match(await page.locator('.market-dialog-content').innerText(),/No offers or purchases/);
  await page.keyboard.press('Escape');
  await page.locator('[data-market-pedigree="sample-barq"]').click();
  assert.equal(await page.locator('[data-pedigree-placeholder] .pedigree-node').count(),7);
  await page.keyboard.press('Escape');
  await page.locator('[name="minPrice"]').fill('3300');
  await page.locator('[name="maxPrice"]').fill('4600');
  await page.locator('[name="sort"]').selectOption('price-desc');
  await page.locator('.market-browse-filters button').click();
  await page.waitForFunction(()=>document.querySelectorAll('.market-listing-card').length===2);
  assert.match(await page.locator('.market-listing-body h2').first().innerText(),/Shahin/);
  await page.locator('[name="search"]').fill('Barq');
  await page.locator('.market-browse-filters button').click();
  await page.waitForFunction(()=>document.querySelectorAll('.market-listing-card').length===1);
  await page.goto(`http://localhost:${port}/marketplace?preview=1`);
  await page.locator('.market-listing-card').first().waitFor();
  await page.locator('[name="minPrice"]').fill('5000');
  await page.locator('[name="maxPrice"]').fill('1000');
  assert.equal(await page.locator('.market-browse-filters').evaluate(f=>f.checkValidity()),false);
  await page.locator('[name="minPrice"]').fill('');
  await page.locator('[name="maxPrice"]').fill('');
  await page.screenshot({path:'test-results/marketplace-desktop.png',fullPage:true});
  assert.equal(mutations.length,0,'sample marketplace must not send offers or purchases');
  await page.goto(`http://localhost:${port}/trainer-profile`);
  await page.locator('.trainer-profile').waitFor();
  await page.locator('.trainer-directory-entry').first().waitFor();
  assert.equal(await page.locator('.trainer-directory-entry').count(),2);
  assert.match(await page.locator('.trainer-profile').innerText(),/Mohammed Alnajjar/);
  assert.match(await page.locator('.trainer-profile').innerText(),/Salim Al Rashidi/);
  assert.equal(await page.locator('[data-trainer-location-edit]').count(),1);
  assert.equal(await page.locator('[data-trainer-photo-upload]').count(),1);
  assert.equal(await page.locator('.trainer-camel-card').count(),0);
  assert.equal(mutations.length,0,'loading the trainer directory must not write to the backend');
  await page.screenshot({path:'test-results/trainer-profile-desktop.png',fullPage:true});

  for (const path of ['challenges','training','organizations','tourism','races','race-cards','marketplace?preview=1','trainer-profile']) {
    await page.setViewportSize({width:390,height:844});
    await page.goto(`http://localhost:${port}/${path}`);
    await page.locator(path === 'training'?'.training-journal':path === 'organizations'?'.organization-directory':path === 'tourism'?'.heritage-experiences':path === 'races'?'.medhmar-races-page':path === 'race-cards'?'.digital-race-cards':path.startsWith('marketplace')?'.marketplace-browse':path === 'trainer-profile'?'.trainer-profile':'.broadcast-preview').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1), `${path} overflows on mobile`);
    if (path === 'training') assert.ok(await page.locator('.journal-session > div').first().evaluate(el=>el.getBoundingClientRect().width > 180), 'mobile session notes must retain readable width');
    if (path === 'trainer-profile') {
      await page.locator('.trainer-directory-entry').first().waitFor();
      assert.ok(await page.locator('.trainer-profile-card').first().evaluate(el=>el.getBoundingClientRect().width>250),'mobile trainer profile must retain a readable width');
      assert.ok(await page.locator('.trainer-profile').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'trainer directory must fit on mobile');
    }
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:`test-results/${path.split('?')[0]}-mobile.png`,fullPage:true});
  }
  // Render the real admin shell using the same CSS loaded by the app. This
  // isolates responsive styling without bypassing the real ADMIN route guard.
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`http://localhost:${port}/home`);
  // The SPA initializes asynchronously. Wait before injecting the shell, or
  // its delayed route render may replace this isolated visual fixture.
  await page.waitForLoadState('networkidle');
  await page.locator('#app .app-shell').waitFor({state:'visible'});
  assert.equal(await page.locator('.brand-wordmark img').first().evaluate(img=>img.complete&&img.naturalWidth>0),true,'public navbar should load the new Medhmar logo');
  await page.evaluate(async()=>{
    const {adminShell}=await import('/js/admin-console.js');
    document.querySelector('#app').innerHTML=adminShell({
      user:{userId:1,fullName:'Test Administrator',roles:['ADMIN']},
      active:'/admin',
      body:'<section class="admin-layout-test">Dashboard content</section>'
    });
  });
  assert.equal(await page.locator('.admin-sidebar').isVisible(),true,'desktop admin sidebar should be visible');
  assert.equal(await page.locator('.admin-sidebar-brand img').evaluate(img=>img.complete&&img.naturalWidth>0),true,'stacked admin brand asset should load');
  assert.equal(await page.locator('.admin-sidebar-brand img').getAttribute('src'),'/assets/medhmar-admin-logo-approved.webp','admin uses the newly approved logo');
  assert.equal(await page.locator('.admin-sidebar-brand img').count(),1,'no duplicated admin branding');
  assert.equal(await page.locator('.admin-mobile-nav').isVisible(),false,'desktop should hide mobile Menu and duplicate icons');
  assert.equal(await page.locator('.admin-sidebar-nav a').count(), 11, 'desktop navigation should contain eleven admin routes');
  assert.equal(await page.locator('.admin-sidebar-nav .admin-nav-icon svg').count(),11,'desktop menu should retain its SVG icons');
  await page.screenshot({path:'test-results/admin-nav-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.admin-sidebar').isVisible(),false,'mobile should hide desktop sidebar');
  assert.equal(await page.locator('.admin-mobile-nav').isVisible(),true,'mobile should show navigation trigger');
  assert.equal(await page.locator('.admin-mobile-nav nav').isVisible(),false,'mobile links should start collapsed');
  await page.locator('.admin-mobile-nav summary').click();
  assert.equal(await page.locator('.admin-mobile-nav nav').isVisible(),true,'mobile menu should expand');
  assert.equal(await page.locator('.admin-mobile-nav nav a').count(), 11, 'mobile navigation should contain eleven admin routes');
  const menuLinks=await page.locator('.admin-mobile-nav nav a').evaluateAll(nodes=>nodes.map(el=>{
    const b=el.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};
  }));
  assert.ok(menuLinks.every((box,i)=>i===0||box.y>=menuLinks[i-1].bottom),
    'admin mobile menu must stack links vertically rather than colliding');
  assert.ok(menuLinks.every(b=>b.x>=0&&b.right<=390+1),'mobile nav items must remain in viewport');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin mobile must not overflow');
  await page.screenshot({path:'test-results/admin-nav-mobile.png',fullPage:true});

  // Health page component with deterministic test-only status and a documented failure state.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async()=>{
    const {adminShell}=await import('/js/admin-console.js');
    const {adminSystemHealthView}=await import('/js/admin-system-health.js');
    const admin={userId:1,fullName:'Test Administrator',roles:['ADMIN']};
    const data={backendStatus:'RESPONDING',databaseStatus:'CONNECTED',
      totalChallenges:7,totalVotes:12,checkedAt:'2026-10-20T07:00:00Z'};
    document.querySelector('#app').innerHTML=adminShell({
      user:admin,active:'/admin/system-health',body:adminSystemHealthView({data})
    });
  });
  assert.equal(await page.locator('.admin-sys-kpi').count(),4);
  assert.match(await page.locator('.admin-sys-kpis').innerText(),/Connected|12|7/);
  assert.equal(await page.locator('#admin-health-check').isVisible(),true);
  await page.screenshot({path:'test-results/admin-system-health-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),
    'mobile admin health should not overflow');
  await page.screenshot({path:'test-results/admin-system-health-mobile.png',fullPage:true});
  await page.evaluate(async()=>{
    const {adminShell}=await import('/js/admin-console.js');
    const {adminSystemHealthView}=await import('/js/admin-system-health.js');
    document.querySelector('#app').innerHTML=adminShell({
      user:{userId:1,roles:['ADMIN']},active:'/admin/system-health',
      body:adminSystemHealthView({data:{
        backendStatus:'RESPONDING',databaseStatus:'DISCONNECTED',
        totalChallenges:null,totalVotes:null,checkedAt:'2026-10-20T07:00:00Z'
      }})
    });
  });
  assert.match(await page.locator('.admin-system-unavailable').innerText(),/Disconnected|Counts are unavailable/);
  assert.equal(await page.locator('.admin-system-count').count(),2);
  assert.equal(await page.locator('.admin-system-count').first().innerText(),'—');
  await page.setViewportSize({width:1440,height:900});
  // Real admin component and tab handler with clearly test-only data.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async()=>{
    const {adminShell,adminDashboard,bindAdminChartTabs}=await import('/js/admin-console.js');
    const activity=Array.from({length:7},(_,i)=>({
      date:'2026-10-'+String(i+13),newUsers:i>4?1:0,newCamels:i===3?2:0,newListings:i===2?1:0
    }));
    document.querySelector('#app').innerHTML=adminShell({
      user:{userId:1,fullName:'Admin',roles:['ADMIN']},active:'/admin',
      body:adminDashboard({summary:{totalUsers:2,activeCamels:2,upcomingRaces:0,activeListings:1,
        generatedAt:'2026-10-19T00:00:00Z',activity,recentEvents:[]}})
    });
    bindAdminChartTabs(document);
  });
  assert.equal(await page.getByRole('tab').count(),3);
  assert.equal(await page.locator('#admin-chart-panel-users .admin-chart-bar').count(),2);
  await page.getByRole('tab',{name:'New Camels'}).click();
  assert.equal(await page.locator('#admin-chart-panel-camels').isVisible(),true);
  assert.equal(await page.locator('#admin-chart-panel-users').isVisible(),false);
  await page.getByRole('tab',{name:'New Camels'}).press('ArrowRight');
  assert.equal(await page.getByRole('tab',{name:'New Listings'}).getAttribute('aria-selected'),'true');
  await page.getByRole('tab',{name:'New Listings'}).press('Home');
  assert.equal(await page.getByRole('tab',{name:'New Users'}).getAttribute('aria-selected'),'true');
  await page.screenshot({path:'test-results/admin-activity-bars-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin chart should not overflow mobile');
  await page.screenshot({path:'test-results/admin-activity-bars-mobile.png',fullPage:true});

  // Approved Manage Users theme: render the real component with test-only records,
  // check the appearance at desktop and mobile viewports without using live accounts.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async()=>{
    const {adminShell,adminUsersView}=await import('/js/admin-console.js');
    const body=adminUsersView({users:[
      {userId:41,fullName:'Test Owner',email:'owner@example.invalid',roles:['OWNER'],accountStatus:'ACTIVE',joinedAt:'2026-10-01T00:00:00Z'},
      {userId:42,fullName:'Test Trainer',email:'trainer@example.invalid',roles:['TRAINER'],accountStatus:'INACTIVE',joinedAt:'2026-10-02T00:00:00Z'}
    ],page:{page:0,totalPages:2,totalElements:21}});
    document.querySelector('#app').innerHTML=adminShell({
      user:{userId:1,fullName:'Test Administrator',roles:['ADMIN']},active:'/admin/users',body
    });
  });
  assert.equal(await page.locator('.admin-users-stat').count(),6,'six role/total statistic cards should show');
  assert.equal(await page.locator('.admin-user-row').count(),2,'real user table component renders test records');
  assert.equal(await page.locator('.admin-users-hero h1').innerText(),'Manage Users');
  assert.equal(await page.locator('#admin-user-filters').isVisible(),true);
  const formLayout = await page.locator('.admin-users-field').evaluateAll(fields =>
    fields.map(field => ({ label:field.querySelector('span')?.textContent?.trim(),
      rect:field.getBoundingClientRect().toJSON() })));
  assert.ok(formLayout.every(f=>f.label&&f.rect.width>100),'every admin filter has a readable label and usable width');
  assert.ok(formLayout[1].rect.x>=formLayout[0].rect.right-1 ||
    formLayout[1].rect.y>=formLayout[0].rect.bottom-1,'role control must not overlap search');
  assert.equal(await page.locator('#admin-users-clear').isVisible(),true);

  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'user management desktop must not overflow');
  await page.screenshot({path:'test-results/admin-users-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.admin-users-hero').isVisible(),true);
  assert.equal(await page.locator('.admin-users-stat').count(),6);
  const compactFilters=await page.locator('.admin-users-field').evaluateAll(fields=>fields.map(f=>f.getBoundingClientRect().toJSON()));
  assert.ok(compactFilters.every(rect=>rect.width>160),'mobile filters must retain usable widths');
  assert.equal(await page.locator('#admin-users-clear').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'user management mobile must not overflow');
  await page.screenshot({path:'test-results/admin-users-mobile.png',fullPage:true});
  // The two admin modules use production renderers, with isolated test-only data.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async()=>{
    const {adminShell}=await import('/js/admin-console.js');
    const {adminChallengesView,adminOrganizationsView,bindAdminModules}=await import('/js/admin-modules.js');
    const orgs={content:[{organizationId:8,name:'Test Organization',region:'Muscat',description:'Test-only entry',contactEmail:'org@example.invalid',status:'ACTIVE',createdAt:'2030-01-01T00:00:00Z'}],page:0,size:20,totalElements:1,totalPages:1};
    const ch={content:[
      {challengeId:5,title:'Barq vs Shaheen',status:'OPEN',creatorId:10,opensAt:'2030-01-01T09:00:00Z',closesAt:'2030-01-02T09:00:00Z',totalVotes:5,camels:[
        {camelId:1,name:'Barq',photoUrl:'/assets/mock-camels/camel-7.jpg',voteCount:3,votePercent:60},
        {camelId:2,name:'Shaheen',photoUrl:'/assets/mock-camels/camel-4.jpg',voteCount:2,votePercent:40}]},
      {challengeId:4,title:'Test Challenge',status:'DRAFT',creatorId:10,opensAt:'2030-01-01T09:00:00Z',closesAt:'2030-01-02T09:00:00Z',totalVotes:0,camels:[]}],page:0,size:20,totalElements:2,totalPages:1};
    document.querySelector('#app').innerHTML=adminShell({user:{userId:1,roles:['ADMIN']},active:'/admin/challenges',body:adminChallengesView({data:ch})});
    bindAdminModules(document.querySelector('#app'),{createChallenge:async payload=>{window.__createdChallenge=payload;}});
    window.__testOrgPage=adminShell({user:{userId:1,roles:['ADMIN']},active:'/admin/organizations',body:adminOrganizationsView({data:orgs})});
  });
  assert.equal(await page.locator('[data-admin-challenge-camel]').count(),1);
  assert.equal(await page.locator('.admin-challenge-card').count(),2);
  assert.equal(await page.locator('.mhch-new').count(),1);
  assert.equal(await page.locator('.mhch-metric').count(),4);
  assert.equal(await page.locator('.mhch-camel').count(),4);
  assert.equal(await page.locator('.mhch-vs').count(),1);
  assert.equal(await page.locator('[data-admin-challenge-filter]').count(),4);
  await page.locator('.mhch-details>summary').first().click();
  assert.match(await page.locator('.mhch-details-content').first().innerText(),/3 votes/);
  await page.locator('.mhch-details>summary').first().click();
  await page.locator('#admin-challenge-search').fill('Test Challenge');
  assert.equal(await page.locator('.admin-challenge-card:visible').count(),1);
  await page.locator('[data-admin-challenge-filter="OPEN"]').click();
  assert.equal(await page.locator('.admin-challenge-card:visible').count(),0);
  assert.equal(await page.locator('#admin-challenge-no-match').isVisible(),true);
  await page.locator('#admin-challenge-search').fill('Barq');
  assert.equal(await page.locator('.admin-challenge-card:visible').count(),1);
  await page.locator('[data-admin-challenge-filter="ALL"]').click();
  await page.locator('#admin-challenge-search').fill('');
  await page.locator('#admin-challenge-create [name="title"]').fill('Morning Cup');
  await page.locator('#admin-challenge-create [name="opensDate"]').fill('2030-01-01');
  await page.locator('#admin-challenge-create [name="closesDate"]').fill('2030-01-02');
  await page.locator('#admin-challenge-create .mhch-save').click();
  await page.waitForFunction(()=>Boolean(window.__createdChallenge));
  assert.deepEqual(await page.evaluate(()=>window.__createdChallenge),{
    title:'Morning Cup',opensAt:'2030-01-01T05:30:00.000Z',closesAt:'2030-01-02T05:30:00.000Z'
  });
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin challenges desktop must not overflow');
  await page.screenshot({path:'test-results/admin-challenges-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.mhch-new').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin challenges mobile must not overflow');
  await page.screenshot({path:'test-results/admin-challenges-mobile.png',fullPage:true});
  await page.evaluate(()=>{document.querySelector('#app').innerHTML=window.__testOrgPage;});
  assert.equal(await page.locator('[data-admin-organization-edit]').count(),1);
  assert.equal(await page.locator('#admin-organization-create').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin organizations mobile must not overflow');
  await page.screenshot({path:'test-results/admin-organizations-mobile.png',fullPage:true});
    assert.deepEqual(errors,[], 'browser must not have unhandled errors');
  console.log('Browser checks passed: preview votes, session dialogs, filters, backend modal binding and mobile layout.');
} finally {
  await browser?.close();
  server.kill();
}
