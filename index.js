const {
  getSheets,
  getAllSheetsData,
  Semester,
  findCollidingLessons,
} = require('./models/tables');

const http = require('http');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const fetchUserTimeTable = require('./src/fetchUserTimeTable');

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const current_semester = "JANUARY 2026";

const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res, next) => {
  res.render('index', {
    docTitle: 'My - Exam Timetable',
    path: '/',
    input: '',
    campus_choice: 'ALL CAMPUSES',
    sheets: await getSheets(),
    items_list: [],
    clashing_units: [],
    current_semester: current_semester,
  });
});

app.get('/api/courses', async (req, res, next) => {
  let { courses, campus_choice } = req.query;
  if (!courses) {
    return res.status(400).json({ error: 'missing courses' });
  }

  courses = courses.replace(/^,|,$|,(?=,)/g, '').trim();
  courses = courses.replaceAll(' ', '');

  let data = await getAllSheetsData(
    courses.length > 0 ? courses.split(/[, ]+/).filter((e) => e) : [],
    parseInt(campus_choice)
  );
  res.json({ data: data });
});

app.get('/api/sheets', async (req, res, next) => {
  let mySheets = await getSheets();
  res.json({ data: mySheets });
});

app.get('/search', async (req, res, next) => {
  const { courses, campus_choice } = req.query;
  if (!courses) {
    return res.redirect('/');
  }
  let mySheets = await getSheets();
  courses = courses.replaceAll(' ', '');
  let presentingData = await getAllSheetsData(
    courses.split(/[, ]+/),
    parseInt(campus_choice)
  );
  res.render('index', {
    docTitle: 'My - Exam Timetable',
    path: '/',
    input: courses,
    campus_choice:
      mySheets[campus_choice > 0 ? campus_choice - 1 : undefined] ||
      'ALL CAMPUSES',
    sheets: mySheets,
    current_semester: current_semester,
    items_list: presentingData,
    clashing_units: findCollidingLessons(presentingData),
  });
});

app.post('/search', async (req, res, next) => {
  let { courses, campus_choice } = req.body;
  courses = courses.replace(/^,|,$|,(?=,)/g, '').trim();
  courses = courses.replaceAll(' ', '');
  let mySheets = await getSheets();
  let presentingData = await getAllSheetsData(
    courses.length > 0 ? courses.split(/[, ]+/).filter((e) => e) : [],
    parseInt(campus_choice)
  );
  res.render('index', {
    docTitle: 'My - Exam Timetable',
    path: '/',
    input: courses,
    campus_choice:
      mySheets[campus_choice > 0 ? campus_choice - 1 : undefined] ||
      'ALL CAMPUSES',
    sheets: mySheets,
    items_list: presentingData,
    clashing_units: findCollidingLessons(presentingData),
    current_semester: current_semester,
  });
});

function sendMessage(courses, to, cb) {
  let table_body = ``;
  let length = 0;
  JSON.parse(courses).forEach((item) => {
    let temp = `<tr>
    <th scope="row" style="line-height: 24px; font-size: 16px; margin: 0;" align="left">${item.course_code}</th>
    <td style="line-height: 24px; font-size: 16px; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; margin: 0; padding: 12px;" align="left" valign="top">${item.day}</td>
    <td style="line-height: 24px; font-size: 16px; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; margin: 0; padding: 12px;" align="left" valign="top">${item.time}
    </td>
    <th style="line-height: 24px; font-size: 16px; margin: 0;" align="left">${item.room}</th>
  </tr>`;
    table_body += temp;
    length += 1;
  });

  let html_content = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html>
    <head>
      <!-- Compiled with Bootstrap Email version: 1.3.1 --><meta http-equiv="x-ua-compatible" content="ie=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <style type="text/css">
        body,table,td{font-family:Helvetica,Arial,sans-serif !important}.ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height:150%}a{text-decoration:none}*{color:inherit}a[x-apple-data-detectors],u+#body a,#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}img{-ms-interpolation-mode:bicubic}table:not([class^=s-]){font-family:Helvetica,Arial,sans-serif;mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;border-collapse:collapse}table:not([class^=s-]) td{border-spacing:0px;border-collapse:collapse}@media screen and (max-width: 600px){.w-lg-48,.w-lg-48>tbody>tr>td{width:auto !important}.w-full,.w-full>tbody>tr>td{width:100% !important}.w-16,.w-16>tbody>tr>td{width:64px !important}.p-lg-10:not(table),.p-lg-10:not(.btn)>tbody>tr>td,.p-lg-10.btn td a{padding:0 !important}.p-2:not(table),.p-2:not(.btn)>tbody>tr>td,.p-2.btn td a{padding:8px !important}.pr-4:not(table),.pr-4:not(.btn)>tbody>tr>td,.pr-4.btn td a,.px-4:not(table),.px-4:not(.btn)>tbody>tr>td,.px-4.btn td a{padding-right:16px !important}.pl-4:not(table),.pl-4:not(.btn)>tbody>tr>td,.pl-4.btn td a,.px-4:not(table),.px-4:not(.btn)>tbody>tr>td,.px-4.btn td a{padding-left:16px !important}.pr-6:not(table),.pr-6:not(.btn)>tbody>tr>td,.pr-6.btn td a,.px-6:not(table),.px-6:not(.btn)>tbody>tr>td,.px-6.btn td a{padding-right:24px !important}.pl-6:not(table),.pl-6:not(.btn)>tbody>tr>td,.pl-6.btn td a,.px-6:not(table),.px-6:not(.btn)>tbody>tr>td,.px-6.btn td a{padding-left:24px !important}.pt-8:not(table),.pt-8:not(.btn)>tbody>tr>td,.pt-8.btn td a,.py-8:not(table),.py-8:not(.btn)>tbody>tr>td,.py-8.btn td a{padding-top:32px !important}.pb-8:not(table),.pb-8:not(.btn)>tbody>tr>td,.pb-8.btn td a,.py-8:not(table),.py-8:not(.btn)>tbody>tr>td,.py-8.btn td a{padding-bottom:32px !important}*[class*=s-lg-]>tbody>tr>td{font-size:0 !important;line-height:0 !important;height:0 !important}.s-4>tbody>tr>td{font-size:16px !important;line-height:16px !important;height:16px !important}.s-6>tbody>tr>td{font-size:24px !important;line-height:24px !important;height:24px !important}}
      </style>
    </head>
    <body class="bg-red-100" style="outline: 0; width: 100%; min-width: 100%; height: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: Helvetica, Arial, sans-serif; line-height: 24px; font-weight: normal; font-size: 16px; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; color: #000000; margin: 0; padding: 0; border-width: 0;" bgcolor="#f8d7da">
      <table class="bg-red-100 body" valign="top" role="presentation" border="0" cellpadding="0" cellspacing="0" style="outline: 0; width: 100%; min-width: 100%; height: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: Helvetica, Arial, sans-serif; line-height: 24px; font-weight: normal; font-size: 16px; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; color: #000000; margin: 0; padding: 0; border-width: 0;" bgcolor="#f8d7da">
        <tbody>
          <tr>
            <td valign="top" style="line-height: 24px; font-size: 16px; margin: 0;" align="left" bgcolor="#f8d7da">
              <table class="container" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tbody>
                  <tr>
                    <td align="center" style="line-height: 24px; font-size: 16px; margin: 0; padding: 0 16px;">
                      <!--[if (gte mso 9)|(IE)]>
                        <table align="center" role="presentation">
                          <tbody>
                            <tr>
                              <td width="600">
                      <![endif]-->
                      <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto;">
                        <tbody>
                          <tr>
                            <td style="line-height: 24px; font-size: 16px; margin: 0;" align="left">
                              <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                <tbody>
                                  <tr>
                                    <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                      &#160;
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <img class="w-16" src="https://assets.bootstrapemail.com/logos/light/square.png" style="height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; width: 64px; border-style: none; border-width: 0;" width="64">
                              <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                <tbody>
                                  <tr>
                                    <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                      &#160;
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <div class="space-y-4">
                                <h1 class="text-4xl fw-800" style="padding-top: 0; padding-bottom: 0; font-weight: 800 !important; vertical-align: baseline; font-size: 36px; line-height: 43.2px; margin: 0;" align="left">Thanks for using timetable.kimworks.buzz</h1>
                                <table class="s-4 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                  <tbody>
                                    <tr>
                                      <td style="line-height: 16px; font-size: 16px; width: 100%; height: 16px; margin: 0;" align="left" width="100%" height="16">
                                        &#160;
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <table class="btn btn-red-500 rounded-full px-6 w-full w-lg-48" role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-radius: 9999px; border-collapse: separate !important; width: 192px;" width="192">
                                  <tbody>
                                    <tr>
                                      <td style="line-height: 24px; font-size: 16px; border-radius: 9999px; width: 192px; margin: 0;" align="center" bgcolor="#dc3545" width="192">
                                        <a href="https://timetable.kimworks.buzz" style="color: #ffffff; font-size: 16px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; border-radius: 9999px; line-height: 20px; display: block; font-weight: normal; white-space: nowrap; background-color: #dc3545; padding: 8px 24px; border: 1px solid #dc3545;">Visit Website</a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                <tbody>
                                  <tr>
                                    <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                      &#160;
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="card rounded-3xl px-4 py-8 p-lg-10" role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-radius: 24px; border-collapse: separate !important; width: 100%; overflow: hidden; border: 1px solid #e2e8f0;" bgcolor="#ffffff">
                                <tbody>
                                  <tr>
                                    <td style="line-height: 24px; font-size: 16px; width: 100%; border-radius: 24px; margin: 0; padding: 40px;" align="left" bgcolor="#ffffff">
                                      <h3 class="text-center" style="padding-top: 0; padding-bottom: 0; font-weight: 500; vertical-align: baseline; font-size: 28px; line-height: 33.6px; margin: 0;" align="center">Your timetable</h3>
                                      <p class="text-center text-muted" style="line-height: 24px; font-size: 16px; color: #718096; width: 100%; margin: 0;" align="center">${length} Number of Items</p>
                                      <table class="p-2 w-full" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                        <tbody>
                                          <div class="table-responsive">
                                            <table class="table table-hover form-tablp" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 100%;">
                                              <thead class="thead-dark">
                                                <tr>
                                                  <th scope="col" style="line-height: 24px; font-size: 16px; border-bottom-width: 2px; border-bottom-color: #e2e8f0; border-bottom-style: solid; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; color: #ffffff; margin: 0; padding: 12px;" align="left" bgcolor="#1a202c" valign="top">NAME</th>
                                                  <th scope="col" style="line-height: 24px; font-size: 16px; border-bottom-width: 2px; border-bottom-color: #e2e8f0; border-bottom-style: solid; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; color: #ffffff; margin: 0; padding: 12px;" align="left" bgcolor="#1a202c" valign="top">DATE</th>
                                                  <th scope="col" style="line-height: 24px; font-size: 16px; border-bottom-width: 2px; border-bottom-color: #e2e8f0; border-bottom-style: solid; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; color: #ffffff; margin: 0; padding: 12px;" align="left" bgcolor="#1a202c" valign="top">TIME</th>
                                                  <th scope="col" style="line-height: 24px; font-size: 16px; border-bottom-width: 2px; border-bottom-color: #e2e8f0; border-bottom-style: solid; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; color: #ffffff; margin: 0; padding: 12px;" align="left" bgcolor="#1a202c" valign="top">VENUE</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                               ${table_body}
                                              </tbody>
                                            </table>
                                          </div>
                                        </tbody>
                                      </table>
                                      <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                        <tbody>
                                          <tr>
                                            <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                              &#160;
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table class="hr" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                                        <tbody>
                                          <tr>
                                            <td style="line-height: 24px; font-size: 16px; border-top-width: 1px; border-top-color: #e2e8f0; border-top-style: solid; height: 1px; width: 100%; margin: 0;" align="left">
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                        <tbody>
                                          <tr>
                                            <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                              &#160;
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <p style="line-height: 24px; font-size: 16px; width: 100%; margin: 0;" align="left">If you have any questions, contact us at <br>
                                         Email: <a href="mailto:support@kimworks.buzz" style="color: #0d6efd;">support@kimworks.buzz</a>.<br>
                                         Whatsapp: <a href="https://api.whatsapp.com/send/?phone=254719399210&text=Hello%20could%20you%20kindly%20help%20me%20out%20here&type=phone_number&app_absent=0" style="color: #0d6efd;">Click To Send Message To Whatsapp</a></p>
                                    </td>
                                  </tr>
                                </tbody>

                              </table>
                              <table class="s-6 w-full" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                <tbody>
                                  <tr>
                                    <td style="line-height: 24px; font-size: 24px; width: 100%; height: 24px; margin: 0;" align="left" width="100%" height="24">
                                      &#160;
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <!--[if (gte mso 9)|(IE)]>
                      </td>
                    </tr>
                  </tbody>
                </table>
                      <![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
  `;
  var options = {
    method: 'POST',
    hostname: 'emailapi.netcorecloud.net',
    port: null,
    path: '/v5/mail/send',
    headers: {
      api_key: process.env.SEND_GRID_KEY,
      'content-type': 'application/json',
    },
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on('data', function (chunk) {
      chunks.push(chunk);
    });

    res.on('end', function () {
      var body = Buffer.concat(chunks);
      cb(body.toString());
    });
  });

  req.write(
    JSON.stringify({
      from: {
        email: 'info@fixafrica.co.ke',
        name: 'Your Timetable',
      },
      subject: 'You request for an emailed Exam Timetable',
      content: [
        {
          type: 'html',
          value: html_content,
        },
      ],
      personalizations: [
        { to: [{ email: `${to}`, name: 'Kimworks Timetable' }] },
      ],
    })
  );
  req.end();
}

app.post('/send/email', (req, res, next) => {
  const { courses, to } = req.body;
  sendMessage(courses, to, (dataReceived) => {
    let sending = dataReceived;
    res.json(sending);
  });
});

app.get('/admin', (req, res, next) => {
  const targetYears = fs.readdirSync('data').filter((year) => {
    const yearPath = `data/${year}`;
    return fs.lstatSync(yearPath).isDirectory();
  });

  const objArray = [];

  targetYears.forEach((year) => {
    const folders = fs.readdirSync(`data/${year}`);

    folders.forEach((folder) => {
      const obj = {};
      const files = fs.readdirSync(`data/${year}/${folder}`);

      obj.year = year;
      obj.folder = folder;
      obj.files = files.map((file) => {
        const filePath = `data/${year}/${folder}/${file}`;
        const fileStats = fs.statSync(filePath);
        const fileSize =
          fileStats.size < 1024
            ? fileStats.size + ' KB'
            : (fileStats.size / (1024 * 1024)).toFixed(2) + ' MB';
        return {
          name: file,
          size: fileSize,
        };
      });

      objArray.push(obj);
    });
  });
  objArray.reverse();

  res.render('admin/uploads', { files: objArray });
});

// app.get("/admin/dashboard", (req, res, next) => {
//   // const { courses, to } = req.body;
//   res.render("admin/dashboard");
// });

app.post('/upload', async (req, res) => {
  // console.log(req);
  var storage = multer.diskStorage({
    destination: `data/${new Date().getFullYear()}/${req.body.semester || Semester.toUpperCase()
      }-SEMESTER`,

    filename: function (req, file, callback) {
      callback(null, file.originalname);
    },
  });

  var upload = multer({ storage: storage }).single('file');

  upload(req, res, function (err) {
    var folders = fs.readdirSync('data/2022');
    var objArray = [];
    folders.forEach((folder) => {
      var obj = {};
      var semester_folders = fs.readdirSync(
        `data/${new Date().getFullYear()}/` + folder
      );
      if (!semester_folders) {
        return;
      }
      obj.folder = folder;
      obj.files = semester_folders.map((fila) => {
        return {
          name: fila,
          size:
            fs.statSync(`data/${new Date().getFullYear()}/${folder}/${fila}`)
              .size < 1024
              ? fs.statSync(
                `data/${new Date().getFullYear()}/${folder}/${fila}`
              ).size + ' KB'
              : (
                fs.statSync(
                  `data/${new Date().getFullYear()}/${folder}/${fila}`
                ).size /
                (1024 * 1024)
              ).toFixed(2) + ' MB',
        };
      });
      objArray.push(obj);
    });
    if (err) {
      res.status(400).send({ error: err, files: objArray });
    } else {
      res.status(200).send({ message: 'success', files: objArray });
    }
  });
});

app.post('/portal-login', async (req, res) => {
  try {
    const response = await fetch(
      'https://student.daystar.ac.ke/login/loginuser',
      {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const setCookieHeader = response.headers.get('Set-Cookie');

    // Split the Set-Cookie header into individual cookies
    const cookies = setCookieHeader.split(', ');

    // Extract the ASP.NET_SessionId cookie
    const sessionIdMatch = cookies.find((cookie) =>
      cookie.startsWith('ASP.NET_SessionId')
    );
    const sessionId = sessionIdMatch?.split(';')[0];

    // Extract the .ASPXAUTH cookie
    const authMatch = cookies.find((cookie) => cookie.startsWith('.ASPXAUTH'));
    const authToken = authMatch?.split(';')[0];

    // Combine the session ID and auth token
    const sessionToken = `${sessionId}; ${authToken}`;
    // console.log(sessionToken);

    // Combine data and session token into a single JSON response
    res.json({ ...data, sessionToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/fetch-timetable', async (req, res) => {
  try {
    const token = req.headers.cookie;
    // console.log(`Fetch Token: ${token}`);
    const dataList = await fetchUserTimeTable(token);
    res.json({ data: dataList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res, next) => {
  res
    .status(404)
    .render('404', { docTitle: '404 Page Not Found Error', path: '/404' });
});

server.listen(3001, () => {
  console.log('Server started on port 3001');
});
