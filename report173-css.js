/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — CHALLAN 173 CSS  (report173-css.js)
   Phase 3A.1 — report173.js se nikala gaya pure CSS block.
   Koi shared state nahi — sirf ek CSS string return karta hai.
   AHEM: report173.js se PEHLE load ho (index.html).
   ═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════
//  چالان کی CSS — ایک ہی جگہ، اسکرین اور پرنٹ دونوں کے لیے
//  پہلے دو الگ نقلیں تھیں (ایک اسکرین کی، ایک پرنٹ کی) جو بار بار
//  ایک دوسرے سے مختلف ہو جاتی تھیں — اسی لیے فارم ہر جگہ الگ نظر
//  آتا تھا (اسکرین، پرنٹ، PDF)۔ اب ایک ہی نقل ہے۔
// ═══════════════════════════════════════════════════════════════════
function _ch173CSS() {
  return `
      /* ── چالان = پورا صفحہ ── chips ki patti sirf CHHUPTI hai, hoti wahin
         hai; cursor ooper le jate hi .peek lag kar wapas nazar aa jati hai. */
      /* AHEM: patti matn ke OOPER (absolute) nazar aati hai — neeche wali
         cheezon ko DHAKELTI nahi. Pehle woh dhakel deti thi, jis se toolbar
         neeche aa jata tha; button tak pohanchte hi cursor ooper wale ilaqe
         se nikal jata, patti chhup jati aur toolbar wapas ooper chala jata —
         button haath se nikal jata tha. Ab toolbar apni jagah se hilta hi
         nahi. */
      body.ch173-focus #misal-doc-bar{
        position:absolute; top:0; left:0; right:0; z-index:60;
        max-height:0 !important; padding-top:0 !important; padding-bottom:0 !important;
        opacity:0; overflow:hidden;
        background:var(--bg-secondary, #fff);
        transition:max-height .18s ease, opacity .18s ease, padding .18s ease;
      }
      body.ch173-focus #misal-doc-bar.peek{
        max-height:240px !important; opacity:1;
        padding-top:6px !important; padding-bottom:6px !important;
        box-shadow:0 8px 18px rgba(0,0,0,.18);
      }
      /* Neeche wali patti bhi hat jaye — poora safha چالان ko mile */
      body.ch173-focus .bottombar{ display:none !important; }
      /* Safhe ki apni BUNYADI naap — 14pt. Ye zaroori hai: warna چالان bahar
         wale ('.page-content' wale) 14 PIXEL ko wirasat mein le leta tha aur
         har khana chhota chhap jata tha. Yahan se har woh khana theek rehta
         hai jis par apni koi alag naap nahi lagi. */
      #ch173-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; }
      /* Unwan: FORM No. aur Urdu heading — dono AIK hi flex dhanche mein,
         is liye dono ka center bilkul aik (linked) */
      /* Unwan: beech wala hissa HAMESHA sacche page-center par (absolute 50%),
         chahe kinaron ka matn kitna bhi lamba ho. FORM No. bhi usi 50% par →
         dono ka center bilkul aik (linked). */
      #ch173-doc .ch173-title-row{ position:relative; display:flex; align-items:baseline;
        justify-content:space-between; width:100%; min-height:1.6em; }
      #ch173-doc .ch173-title-row > span{ white-space:nowrap; }
      #ch173-doc .tt-right{ text-align:right; font-size:14pt; padding-right:1in; }
      #ch173-doc .tt-left{ text-align:left; font-size:14pt; }
      #ch173-doc .tt-mid, #ch173-doc .form-no{
        position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap;
      }
      #ch173-doc .tt-mid{ font-weight:bold; text-decoration:underline; font-size:20pt; }
      #ch173-doc .form-no{ font-style:italic; font-size:12pt; direction:ltr; }

      /* مقدمہ نمبر / مورخہ / جرم — unwan ke neeche, table se pehle */
      /* مقدمہ نمبر / مورخہ / جرم — koi dashes nahi, data ke hisab se khud fit */
      #ch173-doc .ch173-caseline{ display:flex; gap:22px; align-items:baseline; font-size:14pt;
        margin:18px 0 16px 0; direction:rtl; flex-wrap:wrap; line-height:1.4;
        justify-content:center; }
      #ch173-doc .ch173-caseline .fl{ display:inline-block; min-width:40px;
        border:none; text-align:right; outline:none; font-weight:normal;
        unicode-bidi:isolate; direction:rtl; }
      #ch173-doc .ch173-caseline .fl-lg{ min-width:60px; }
      /* "ت پ" — دفعات کے بعد آخر میں، اپنا الگ خانہ */
      #ch173-doc .ch173-caseline .fl-suf{ min-width:24px; }

      /* AUTO NAAP: 'fixed' ki bajaye 'auto' — ab har khana apne matn ke
         hisab se chaura hota hai (jitna mawad, utni chaurai). کالم 7 ko
         colgroup mein 100% diya gaya hai, is liye bachi hui saari jagah
         wohi le leta hai. */
      #ch173-doc .ch173-table{ width:100%; border-collapse:collapse; table-layout:auto; direction:rtl; }
      #ch173-doc .ch173-table th, #ch173-doc .ch173-table td{
        border:1px solid #000; padding:2px 4px; text-align:center;
        white-space:normal; word-wrap:break-word; overflow-wrap:break-word;
        position:relative; line-height:1.15;
      }
      /* Header row 1: jagah ke hisab se chhota font */
      #ch173-doc .ch173-table thead th{ font-size:14pt; vertical-align:middle; line-height:1.1;
        font-weight:normal; position:relative; padding:1px 4px; }
      /* Data khane: columns 1–6 → Ascending (neeche se ooper). AHEM: CSS transform
         seedha <td> par kaam nahi karta (browser nazar-andaz kar deta hai), is liye
         matn andar <div> wrapper mein rakh kar us par lagate hain. */
      #ch173-doc .ch173-table td{ font-size:14pt; vertical-align:top; line-height:1.15; }
      /* Khane KHUD nahi phailte — sirf haath se (drag) resize hote hain */
      /* USOOL: lambai columns 1–6 se tay. Column 7 usi lambai mein mehdood
         rehta hai — uska baqi matn neeche wale khane mein chala jata hai.
         AHEM: khane ki unchai PUKHTA honi zaroori hai, warna system pehchan
         hi nahi pata ke matn zyada hai. */
      /* Khane ki unchai MUQARRAR — isi se (a) neeche wali lakeer se unchai
         badalti hai, aur (b) column 7 ka izafi matn neeche wale khane mein
         jata hai. Unchai aap khud drag kar ke badal sakte hain. */
      /* Unchai bhi matn ke hisab se. Muqarrar naap hata di gayi hai —
         qatar apne matn jitni hoti hai, phir _ch173StretchRow() usay safha
         bharne tak barha deta hai aur _ch173TrimRowGap() fazool jagah kaat
         deta hai. Yani "jitna mawad, utni lambai" — magar safha khali nahi
         rehta. (Officer phir bhi lakeer kheench kar apni naap le sakta hai.) */
      #ch173-doc .ch173-table tbody td{ height:auto;
        padding:0; overflow:visible; position:relative; vertical-align:top; }
      /* ASCENDING (neeche se ooper) — writing-mode Chrome mein na-qabil-e-aitbaar
         hai, is liye seedha ghumao (rotate) use karte hain. Khana relative,
         andar ka box absolute + rotate(90deg) → RTL Urdu neeche se ooper. */
      /* Khane ke andar clip-box — rotated matn kabhi doosre column mein na jaye */
      #ch173-doc .ch173-table td.rotcell, #ch173-doc .ch173-table th.rotcell{
        position:relative; padding:0; overflow:hidden;
      }
      /* Khadi likhayi — SIRF CSS (koi JS naap nahi), is liye print par bhi
         khud theek rehti hai. writing-mode se matn khada, rotate(180) se
         NEECHE se OOPER (Ascending). */
      #ch173-doc .cellbox{ position:relative; width:100%; height:100%; overflow:hidden; }
      /* Khadi likhayi ka block khane ke BEECH mein (pehle dayen kinare se
         chipka hua tha). rotclip ko flex bana kar beech mein rakhte hain. */
      /* Naam aur CNIC do alag khane — saath saath.
         Naam NEECHE se shuru, CNIC OOPER se. */
      #ch173-doc .rotclip{ position:absolute; inset:0; overflow:hidden;
        display:flex; flex-direction:row; justify-content:center; align-items:stretch; }
      /* Column 7 — normal RTL (khadi nahi), khane ke andar hi mehdood */
      #ch173-doc .hcell-td{ padding:0; vertical-align:top; }
      #ch173-doc .hinner{
        width:100%; height:100%; padding:5px; box-sizing:border-box;
        direction:rtl; text-align:justify; text-align-last:right; outline:none;
        line-height:1.15; overflow:hidden; overflow-wrap:break-word;
        white-space:pre-wrap; font-size:14pt;
      }
      /* اختتامی خانہ — 2 برابر کالم۔ flex اس لیے کہ دونوں کالم ہمیشہ ایک جتنے
         چوڑے رہیں اور ایک ساتھ ہی نیچے بڑھیں (ایک دوسرے سے آگے نہ نکلے) */
      /* ── اختتامی خانہ ──
         Pehle yeh do alag column the (kaghaz dayen, SHO bayen), is liye SHO ki
         dono lines ke DARMIYAN ki jagah zaya jati thi. Ab SHO ki pehli line
         bayen kinare par "behti" hai aur kaghaz us ke ird-gird se guzar kar
         us ke NEECHE bhi chale jate hain — poori chaurai kaam mein aati hai.
         SHO ki doosri line tamam kaghazon ke neeche aati hai. */
      #ch173-doc .ch173-sho-flex{
        display:block; direction:rtl;
        margin-top:1.25em;      /* izafi matn aur تفصیل کاغذات ke darmiyan AIK satar */
      }
      #ch173-doc .ch173-sho-flex::after{ content:''; display:block; clear:both; }
      /* SHO ki lines ke OOPER ki jagah:
         • pehli line — ooper wali lakeer ke saath lagi hui (bilkul thori jagah)
         • doosri line — pehle 1.2cm thi, ab aadhi (0.6cm) */
      #ch173-doc .sho-b1{ float:left; margin-right:0.7cm; margin-top:0.1cm; }
      #ch173-doc .sho-b2{ clear:both; float:left; margin-top:1.4cm; }  /* dastkhat ke liye munasib fasla */
      #ch173-doc .ch173-sho-flex > .sho-col{ min-width:0; box-sizing:border-box; }
      /* تفصیل کاغذات کا خانہ SHO لائن کے دائیں کنارے سے 1cm پہلے تک پھیلتا ہے */
      #ch173-doc .ch173-sho-flex > .sho-papers{ flex:1 1 auto; }
      /* SHO کالم — چوڑائی صرف اپنی لائن جتنی (شرنک-ٹو-فٹ) */
      #ch173-doc .ch173-sho-flex > .sho-cell{ flex:0 0 auto; }

      /* دائیں کالم — تفصیل کاغذات (عنوان) + اس کے نیچے لکھنے کی جگہ */
      #ch173-doc .sho-papers{ text-align:right; padding:4px 6px 0 0; }
      #ch173-doc .sho-papers-head{
        font-weight:700; text-decoration:underline; white-space:nowrap;
        font-size:14pt; line-height:1.25; margin:0;
      }
      /* تفصیل کاغذات — چیک لسٹ کھولنے والا چھوٹا بٹن (چھپائی میں نہیں آتا) */
      #ch173-doc .papers-pick{
        margin-right:6px; width:20px; height:20px; line-height:1; padding:0;
        border:1px solid var(--border,#999); border-radius:4px; vertical-align:middle;
        background:#eef6ff; color:#0369a1; cursor:pointer; font-size:12px;
        text-decoration:none; font-weight:400;
      }
      /* کرسر یہاں بلنک کرتا ہے — ڈیٹا عنوان کے نیچے سے شروع ہوتا ہے */
      /* AHEM — کاغذات ki tarteeb DAYEN se BAYEN.
         app-core.js ka aam qanoon is khane par 'unicode-bidi:plaintext' laga
         deta hai, jis ka matlab: satar ka rukh us ke PEHLE HARF se tay ho.
         Kaghazon ke saath tadaad ke angrezi hindse hone ki wajah se rukh ulat
         kar bayen-se-dayen ho gaya tha aur tarteeb ulti ho gayi thi. Yahan
         !important se rukh pakka RTL kar dete hain. */
      #ch173-doc .sho-papers-body{
        font-size:14pt; line-height:1.25; white-space:normal;
        text-align:justify; text-align-last:right;    /* kaghaz barabar phaile */
        direction:rtl !important; unicode-bidi:embed !important;
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 4px; margin-top:4px;
        min-height:22px; overflow-wrap:break-word;
      }
      /* Har kaghaz apne andar bhi apna rukh sambhale */
      #ch173-doc .pp-item{ direction:rtl; unicode-bidi:isolate; }
      #ch173-doc .pp-name{ unicode-bidi:isolate; }
      #ch173-doc .sho-papers-body:empty::before{
        content:'یہاں کاغذات کی تفصیل لکھیں'; color:#bbb; font-size:12pt;
      }
      /* ── کاغذات: نام (انڈر لائن) + بالکل نیچے تعداد کا خانہ ──
         Kaghaz dayen se bayen aik ke baad aik lagte hain; darmiyan mein MS Word
         ke aik Tab (0.5in = 1.27cm) jitni jagah. Satar bhar jane par agla
         kaghaz KHUD nayi satar par chala jata hai (inline-block ka wrap). */
      #ch173-doc .pp-item{
        display:inline-flex; flex-direction:column; align-items:center;
        vertical-align:top; text-align:center;
        margin-left:0.635cm; margin-bottom:4px;  /* Tab = 4 spaces (1.27cm = 8) */
      }
      /* رزلٹ نمبری — naam ke saath usi satar mein (underline ke bagair) */
      #ch173-doc .pp-rno{ text-decoration:none; font-weight:normal; }
      #ch173-doc .pp-name{
        display:block; text-decoration:underline; white-space:nowrap;
        line-height:1.25;
      }
      /* Tadaad — har kaghaz ke bilkul neeche, IO khud likhta hai */
      /* Tadaad ka khana naam ke bilkul NEECHE, BEECH mein.
         'margin:0 auto' hi wo cheez hai jo isay beech mein laati hai —
         pehle yeh poori chaurai le kar aik taraf ho jata tha. */
      #ch173-doc .pp-qty{
        display:block; min-width:1.6em; margin:0 auto; box-sizing:border-box;
        min-height:1.15em; outline:none; padding:0;
        line-height:1.25; text-align:center !important;
        direction:ltr; unicode-bidi:isolate;      /* hindsa naam ke theek neeche beech mein */
      }
      #ch173-doc .pp-qty:empty::before{ content:'—'; color:#c9c9c9; }
      @media print{ #ch173-doc .pp-qty:empty::before{ content:''; } }

      /* بائیں کالم — SHO/تاریخ: ایک اوپر، ایک نیچے */
      /* SHO ka khana OOPER se shuru — pehli line تفصیل کاغذات ke khane ke
         bilkul barabar. Doosri line ki jagah JS naap kar tay karta hai
         (_ch173AlignSho) taake woh theek wahan se shuru ho jahan کاغذات ka
         aakhri hindsa khatam hota hai. */
      #ch173-doc .sho-cell{
        display:flex; flex-direction:column; justify-content:flex-start;
        min-height:42mm;
      }
      /* align-self:flex-end → RTL میں بائیں کنارے پر (جیسے اصل فارم میں) */
      #ch173-doc .sho-block{ align-self:flex-end; }
      /* SHO ki line ko aik satar neeche laane wali khali jagah */
      #ch173-doc .sho-spacer{ height:0; }   /* SHO ki pehli line ab ooper se barabar */
      #ch173-doc .sho-cell-row{
        outline:1px dashed rgba(120,120,120,0.35); padding:3px 6px; line-height:1.25;
        min-height:20px; margin:0; font-size:14pt; text-align:right; white-space:nowrap;
        font-weight:700;
      }
      /* تاریخ bold nahi — sirf SHO ki line.
         SHO ki line aur تاریخ ka darmiyani faasla kam rakha gaya hai
         (ooper wali padding ghata kar) — dono qareeb nazar aayen. */
      #ch173-doc .sho-cell-date{ font-weight:normal; font-size:14pt; color:#333;
        cursor:pointer; text-align:center;
        padding-top:0; margin-top:-3px; }
      #ch173-doc .sho-cell-date:empty::before{ content:'تاریخ…'; color:#aaa; }
      /* SHO ka naam set na ho to saaf hidayat (اوزار → SHO se set karein) */
      #ch173-doc .sho-cell-row:empty::before{
        content:'⚠ اوزار → SHO سے نام درج کریں'; color:#c00; font-size:11pt; font-weight:normal;
      }
      @media print{ #ch173-doc .sho-cell-row:empty::before{ content:''; } }
      @media print{
        #ch173-doc .sho-papers-body{ outline:none !important; }
        #ch173-doc .sho-papers-body:empty::before{ content:''; }
        #ch173-doc .sho-cell-row{ outline:none !important; }
        #ch173-doc .sho-cell-date:empty::before{ content:''; }
      }
      /* Izafi khane screen par nazar aayen (kahan likhna hai pata chale) —
         print mein yeh nishan nahi aata */
      /* ملزمان chunne wala chhota button */
      #ch173-doc .acc-pick{
        position:absolute; top:2px; left:2px; z-index:7;
        width:20px; height:20px; line-height:1; padding:0;
        border:1px solid var(--border,#999); border-radius:4px;
        background:#eef6ff; color:#0369a1; cursor:pointer; font-size:12px;
      }
      /* Column 7 — normal RTL (khadi nahi) */
      /* USOOL: column 7 table ki lambai NAHI barhata — jo matn na samaye
         woh khud table ke neeche wale khane mein chala jata hai */
      /* Column 7 khane ke barabar — table ko lamba NAHI karta.
         Jo matn na samaye woh neeche wale khane mein chala jata hai. */
      #ch173-doc .ch173-table td.normcell{ padding:0; vertical-align:top;
        position:relative; overflow:hidden; }
      #ch173-doc .normwrap{
        position:absolute; inset:0;    /* khane ke barabar — table lamba nahi hota */
        padding:5px 5px 0 5px; box-sizing:border-box;   /* neeche ki padding 0 */
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; text-align:justify; text-align-last:right;
        outline:none; line-height:1.5; font-size:14pt;   /* satron ka fasla — 1.5 */
        overflow-wrap:break-word; word-wrap:break-word;
        overflow:hidden;   /* jo na samaye woh neeche wale khane mein jayega */
      }
      /* Har paragraph ki aakhri line bhi dayen (beech mein nahi) */
      #ch173-doc .normwrap p, #ch173-doc .normwrap div{ text-align:justify; text-align-last:right; }
      /* Paste kiya hua matn apna font saath na laye */
      #ch173-doc .normwrap *, #ch173-doc .ch173-cont *{
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
      }
      #ch173-doc .ch173-cont:empty::before{
        content:'تسلسل — جو تحریر اوپر خانوں میں نہ سما سکے وہ یہاں لکھیں';
        color:#aaa; font-size:12pt;
      }
      /* Table ke NEECHE tasalsul — table se BILKUL chipka hua (koi gap nahi) */
      #ch173-doc .ch173-cont{
        margin:0 !important; border:none !important; padding:0 5px !important;
        min-height:0; direction:rtl; text-align:justify; text-align-last:right;
        font-size:14pt; line-height:1.5; outline:none;   /* کالم 7 jaisa hi — 1.5 */
        overflow-wrap:break-word; word-wrap:break-word; white-space:pre-wrap;
      }
      #ch173-doc .ch173-cont:empty{ min-height:0; padding:0 !important; }
      /* ═══ فہرست گواہان — اخراج ka ALAG kaghaz ═══ */
      /* Satar 1 ke OOPER 0.25 inch ka hashiya */
      #ch173-doc .akh-gw-page{ direction:rtl; padding-top:0.25in; }
      /* Pehli satar: تھانہ dayen kinare se THEEK 1 INCH andar, ضلع bayen kinare par.
         Is ke aur agli satar (سرکار بذریعہ) ke darmiyan 0.4 inch ka faasla. */
      #ch173-doc .akh-gw-l1{
        display:flex; justify-content:space-between; align-items:baseline;
        padding-right:1in; margin-bottom:0.4in;
      }
      #ch173-doc .akh-gw-l1 .akh-gw-thana{ text-align:right; outline:none; }
      #ch173-doc .akh-gw-l1 .akh-gw-zila{ text-align:left; outline:none; }
      /* سرکار بذریعہ · مقدمہ نمبر… · بنام۔ — teenon satrein dayen border se 1.25 INCH */
      #ch173-doc .akh-gw-l2,
      #ch173-doc .akh-gw-l3,
      #ch173-doc .akh-gw-l4{
        text-align:right; text-align-last:right; outline:none;
        padding-right:1.25in; margin-bottom:8px; font-size:14pt;
      }
      /* Chauthi satar — beech mein, 20pt */
      #ch173-doc .akh-gw-title{
        text-align:center; font-size:20pt; font-weight:700;
        margin:18px 0 14px; text-decoration:underline;
      }
      /* گواہان — naam bhi dayen border se 1.25 INCH, aur 14pt */
      #ch173-doc .akh-gw-body{
        direction:rtl !important; outline:none;
        padding-right:1.25in; min-height:3em; margin-bottom:26px;
        font-size:14pt; line-height:1.9;
      }
      #ch173-doc .akh-gw-body:empty::before{
        content:'یہاں گواہان کی فہرست لکھیں'; color:#aaa;
      }
      @media print{ #ch173-doc .akh-gw-body:empty::before{ content:''; } }
      /* Aik گواہ = aik satar: naam DAYEN, CNIC apni ALAG field mein.
         Tamam CNIC aik hi SEEDH mein aur LTR — jaise چالان mein muqarrar hai. */
      #ch173-doc .akh-gw-body .gw-ln{
        display:flex; align-items:baseline; gap:10px; font-size:14pt;
      }
      #ch173-doc .akh-gw-body .gw-nm{ flex:1 1 auto; text-align:right; }
      #ch173-doc .akh-gw-body .gw-cn{
        flex:0 0 2.1in; width:2.1in;
        direction:ltr; unicode-bidi:isolate; text-align:left;
        font-family:'Segoe UI',Arial,sans-serif; font-size:12pt;
      }
      /* Aakhir mein SHO + تاریخ — bilkul چالان ke aakhir jaisa (bayen kinare par) */
      #ch173-doc .akh-gw-sho{ margin-top:34px; width:max-content; margin-left:0; margin-right:auto; }

      /* اخراج table — column 2 ki BAYEN lakeer ko kheenchne wala grip */
      #ch173-doc .akh-col2{ }
      #ch173-doc .akh-grip{
        position:absolute; left:-3px; top:0; width:7px; height:100%;
        cursor:col-resize; z-index:5; background:transparent;
      }
      #ch173-doc .akh-grip:hover{ background:rgba(3,105,161,.25); }
      /* Row 8 ki NEECHE wali lakeer — ooper neeche kheenchne wali patti */
      #ch173-doc .akh-hgrip{
        position:absolute; left:0; right:0; bottom:-3px; height:7px;
        cursor:row-resize; z-index:5; background:transparent;
      }
      #ch173-doc .akh-hgrip:hover{ background:rgba(3,105,161,.25); }

      /* ══ اخراج / عدم پتہ ki 3-column table — SIRF is table ke usool ══
         (چالان ki 7-column table in se bilkul mutasir nahi hoti) */

      /* SATRON ka fasla thora KHULA — pehle qatarein bahut chipki hui thin.
         مختصر حالات wale khane ko bhi wohi fasla (warna woh 1.5 par reh jata,
         kyunke us ka apna qanoon ooper likha hai). */
      #ch173-doc .ch173-akhraj-table td{ line-height:1.9; }
      /* ═══ Row 8 (مختصر حالات) — ooper neeche ki KHALI JAGAH khatam ═══
         AHEM: is jagah ki asal wajah 'line-height:1.9' thi. Aik satar ke
         matn par 1.9 ka matlab hai ke lafzon ke OOPER aur NEECHE takreeban
         9-9px khali chhor di jaye — yehi unwaan ke gird nazar aati thi.
         Sirf AAKHRI qatar par satar ka fasla tang kar dete hain (1.25), aur
         andar bahar ki tamam padding sifar. Qatarein 1-7 aur چالان ki table
         bilkul nahi chhirtin. */
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td{
        line-height:1.25; padding-top:1px !important; padding-bottom:1px !important;
        vertical-align:middle;
      }
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td.normcell{
        padding:0 !important;
      }
      /* Matn ka apna fasla — table ke NEECHE wale matn jaisa (1.5) */
      #ch173-doc .ch173-akhraj-table tbody tr:last-child td.normcell .normwrap{
        line-height:1.5; padding:0 4px 0 4px;
      }
      /* ── مثل باندھنے کی جگہ — دوسرے صفحے کے اوپر بائیں کونے میں مثلث ──
         Nok top-left kone par, dono lambe bazoo (top aur left margin ke saath)
         2-2 inch ke. Matn is se bach kar behta hai. Saath hi pehli satar ko
         ooper wale hashiye se aik satar ka fasla milta hai. */
      #ch173-doc .ch173-bind{
        float:left; width:2in; height:2in; margin-top:1.25em;
        shape-outside:polygon(0 0, 2in 0, 0 2in);
        -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 2in 0, 0 2in);
      }
      /* Safhe ka tor — sirf chapai mein */
      #ch173-doc .ch173-pgbrk{ display:none; }
      @media print{
        #ch173-doc .ch173-pgbrk{
          display:block; height:0; margin:0; padding:0;
          break-before:page; page-break-before:always;
        }
      }
      /* Screen par yeh nishan nazar nahi aata — sirf chapai ke liye hai */
      #ch173-doc .ch173-bind{ display:none; }
      @media print{ #ch173-doc .ch173-bind{ display:block; } }
      /* CNIC ka APNA khana — naam se alag.
         • Naam  : NEECHE se OOPER (direction:rtl ke saath vertical-rl)
         • CNIC  : OOPER se NEECHE (direction:ltr)
         • Dono ke darmiyan 1.5cm ka fasla */
      /* Har khadi khane ka matn ooper se 1cm neeche shuru ho */
      #ch173-doc .rotinner{
        width:auto; max-width:100%; height:100%; box-sizing:border-box;
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
        direction:rtl; outline:none; unicode-bidi:plaintext;
        line-height:1.2; white-space:pre; word-break:keep-all;
        overflow-wrap:normal; overflow:hidden; font-size:14pt;
        /* Khadi likhayi mein pehli qeemat OOPER/NEECHE ki jagah hai —
           isay kam rakha hai taake har record Row 2 ki lakeer se bilkul
           saath shuru ho (ooper-neeche fazool jagah na bane). */
        padding:1px 4px;
        /* HAR SATAR ka aaghaz OOPER (Row 2 wali lakeer) se.
           AHEM: yahan 'flex' HARGIZ na lagayen — khadi likhayi (vertical
           writing-mode) mein flex ka rukh ghair-yaqeeni hai, isi wajah se
           doosra/teesra naam aage-ooper khisak jata tha. Saada block mein
           har satar khud ooper se shuru hoti hai. */
        display:block; text-align:start;
      }
      /* CNIC — naam ke saath usi satar mein, magar OOPER se NEECHE parhi jaye
         aur numbers LTR (seedhi tarteeb) mein rahen.
         AHEM: yahan 'transform:rotate' HARGIZ na lagayen — transform sirf
         dikhawa ghumata hai, JAGAH nahi. Us se CNIC ka khaka chaurai wala hi
         rehta tha, jis se naam kinare par dhakel jata tha aur ooper-neeche
         fazool jagah ban jati thi. writing-mode + text-orientation se khaka
         bhi durust naapa jata hai (aur yeh Chrome mein chalta hai —
         'sideways-lr' sirf Firefox ka hai, woh nahi use karna). */
      #ch173-doc .rotinner .cn{
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
        text-orientation:sideways; -webkit-text-orientation:sideways;
        direction:ltr; unicode-bidi:isolate; white-space:nowrap;
      }
      /* Har satar ka apna khana: NAAM shuru (ooper) — CNIC aakhir (neeche).
         Khadi likhayi mein 'inline-size' poori UNCHAI hoti hai, is liye
         100% dene se har satar poore khane jitni lambi ho jati hai aur
         'space-between' CNIC ko bilkul neeche le jata hai — chunanche
         tamam CNIC aik hi seedh mein aa jate hain (naam chhota ho ya bara). */
      #ch173-doc .rotinner .ln{
        display:flex; flex-direction:row; justify-content:space-between;
        align-items:flex-start; inline-size:100%; min-inline-size:0;
      }
      /* تتمہ چالان — CNIC nahi, is liye satar poori unchai na ghere,
         sirf naam jitni jagah le */
      #ch173-doc.tatima-doc .rotinner .ln,
      body.tatima-active #ch173-doc .rotinner .ln{
        inline-size:auto; justify-content:flex-start;
      }
      #ch173-doc .rotinner .nm{ flex:0 1 auto; min-inline-size:0; overflow:hidden; }
      #ch173-doc .rotinner .ln > .cn{ flex:0 0 auto; }
      /* CNIC ka apna khana — naam ke saath, OOPER se NEECHE parhi jaye,
         aur naam se 1.5cm ka fasla */
      /* Khaka print mein BHI aaye — pehle print par yeh chhupa diya jata
         tha, is liye khali CNIC ka khana bilkul khali chhap jata tha */
      /* CNIC — USI SATAR mein naam ke saath, 1.5cm ke fasle par.
         (Aik satar = naam + CNIC. Alag satar NAHI.) */
      /* Column 7 — normal, RTL, justified */
      #ch173-doc .hwrap{
        writing-mode:horizontal-tb; transform:none;
        width:100%; height:100%; padding:5px; box-sizing:border-box;
        direction:rtl; text-align:justify; outline:none;
      }

      /* Khadi likhayi — NEECHE se OOPER (earth → sky) */
      /* Header ki khadi likhayi — Ascending (neeche se ooper) */
      #ch173-doc .vtxt{
        display:inline-block;
        writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; -ms-writing-mode:tb-rl;
        transform:rotate(180deg); -webkit-transform:rotate(180deg);
        white-space:nowrap; line-height:1.2; text-align:center;
      }
      /* Header ki unchai kam — pehle 150px thi jis se row 1-2 ke alfaz ke
         ooper-neeche kaafi khali jagah bach jati thi. (Haath se kheench kar
         bhi badal sakte hain.) */
      #ch173-doc th.vcell{ vertical-align:middle; padding:0; text-align:center; height:96px; }
      /* Header ki khadi likhayi — data khanon jaisa hi wrapper (Ascending) */
      /* مال قبضہ پولیس — lakeeron se hat kar, khane ke beech mein */
      #ch173-doc .rothead{ text-align:center !important;
        white-space:normal; padding:2px 4px; font-size:12pt; line-height:1.2; }

      #ch173-doc th.hcell{ vertical-align:middle; text-align:center; direction:rtl; white-space:normal; }

      /* Bahar ke kinare khule — pehla column dayen se, aakhri bayen se */
      #ch173-doc .ch173-table thead tr:first-child th:first-child{ border-right:none; }
      #ch173-doc .ch173-table thead tr:first-child th:last-child{ border-left:none; }
      /* Data row (row 3): dono kinare khule — dayen bhi, bayen bhi */
      #ch173-doc .ch173-table tbody tr > td:first-child{ border-right:0 !important; }
      #ch173-doc .ch173-table tbody tr > td:last-child{ border-left:0 !important; }
      #ch173-doc .ch173-table tbody tr > td:nth-last-child(1){ border-left:0 !important; }
      /* Row 2 ki bayen aakhri line hataayi */
      #ch173-doc .ch173-table thead tr:nth-child(2) th:last-child{ border-left:none; }
      /* USOOL: columns 1–6 neeche se BAND (lakeer), column 7 khula */
      #ch173-doc .ch173-table tbody td{ border-bottom:1px solid #000 !important; }
      #ch173-doc .ch173-table tbody td.normcell{ border-bottom:0 !important; }

      /* MS Word jaisi column resize — header par drag handle */
      #ch173-doc .colgrip{
        position:absolute; top:0; left:-3px; width:7px; height:100%;
        cursor:col-resize; user-select:none; z-index:5;
      }
      /* Neeche se unchai badalne wali grip (row height) */
      /* Neeche se unchai badalne wali grip — khane ke ANDAR (kabhi kat na jaye) */
      #ch173-doc .rowgrip{
        position:absolute; bottom:0; left:0; width:100%; height:12px;
        cursor:row-resize; user-select:none; z-index:20;
      }
      /* "ملزمان" ke NEECHE wali lakeer wali grip — khane ke OOPER kinare par */
      #ch173-doc .rowgrip-top{ top:0; bottom:auto; }
      #ch173-doc .rowgrip:hover{ background:rgba(56,189,248,0.45); }
      #ch173-doc .colgrip:hover{ background:rgba(56,189,248,0.35); }
`;
}
window._ch173CSS = _ch173CSS;
