const xlsxFile = require('read-excel-file/node');

require('dotenv').config();
// let Semester = "August";

let Semester = 'September';

let fileName = 'data/DRAFT_ EXAMINATION TIMETABLE -JANUARY 2025_.xlsx';

async function getSheets() {
  let sheets = [];
  sheets = await xlsxFile.readSheetNames(fileName);
  sheets.forEach((eleme, index, array) => {
    if (eleme.includes('NAI')) {
      array[index] = 'NAIR ' + eleme.split('NAIROBI')[1];
    }
  });
  return sheets;
}

function output(sheetNumber) {
  return new Promise(async (resolve, reject) => {
    const tables = [];

    let rows = await xlsxFile(fileName, { sheet: sheetNumber });
    rows.forEach((element) => {
      tables.push(element);
    });
    return resolve({
      variables: tables,
    });
  });
}

function getInterval(objectList, V, i) {
  let newParams = objectList;

  if (i < 0) {
    return objectList[0];
  }
  if (V > objectList[objectList.length - 1].index) {
    return objectList[objectList.length - 1];
  }

  if (V == objectList[i].index) {
    return objectList[i];
  }

  if (V < objectList[i].index) return getInterval(newParams, V, i - 1);

  if (V > objectList[i].index) return objectList[i];
}

async function getCourses(params, sheetNumber) {
  const { variables } = await output(sheetNumber);

  let variablesWithoutNull = [];
  variables.forEach((nonArr) => {
    variablesWithoutNull.push(nonArr.filter((elem) => elem !== null));
  });

  //
  let MAX_INDEX_NULL = [];
  for (
    let indexesNull = variablesWithoutNull.length - 1;
    indexesNull > 0;
    indexesNull--
  ) {
    if (variablesWithoutNull[indexesNull].length <= 0) {
      MAX_INDEX_NULL.push(indexesNull);
    }
  }

  function diffs(arr) {
    return arr.slice(1).map((num, i) => (num - arr[i]) * -1);
  }
  let differences = diffs(MAX_INDEX_NULL);
  let MAX_INDEX =
    MAX_INDEX_NULL[
      differences.indexOf(differences.find((nonOne) => nonOne > 1))
    ];

  let time = [];
  variables.forEach((timeElement, timeIndex) => {
    if (timeElement.find((str) => /:0/.test(str))) {
      time.push(timeIndex);
    }
  });

  let firstWeekDays = variables[time[0] - 1]
    .map((eleme, index) => {
      return { eleme, index };
    })
    .filter((ele) => ele.eleme !== null);

  let secondWeekDays = variables[time[1] - 1]
    .map((eleme, index) => {
      return { eleme, index };
    })
    .filter((ele) => ele.eleme !== null);

  let foundItem = [];
  let j = 0;
  for (let i = 0; i < params.length; i++) {
    let searchString = `${params[i]}`;
    //
    //

    variablesWithoutNull.forEach((element, index) => {
      if (
        element.some((arriri, indexiis) =>
          arriri.split(/[ ]/).join('').includes(searchString)
        )
      ) {
        let elements = [];
        elements = element.filter((arr, ind) => {
          arr = arr.split(' ').join('');
          const hasTwoOrFewerSlashes = arr.split('/').length <= 2;
          const meetsComplexCriteria =
            ind !== 0 && !arr.includes('CHAPEL') && !/.+\-.+/.test(arr);
          const containsSearchString = arr.includes(
            searchString.replace(/\s/g, '')
          );
          return (
            hasTwoOrFewerSlashes && meetsComplexCriteria && containsSearchString
          );
        });

        elements.forEach((foundElement) => {
          foundItem.push({
            course_code: foundElement,
            // row: index,
            day:
              index >= time[1]
                ? getInterval(
                    secondWeekDays,
                    variables[index].indexOf(foundElement),
                    secondWeekDays.length - 1
                  ).eleme
                : getInterval(
                    firstWeekDays,
                    variables[index].indexOf(foundElement),
                    firstWeekDays.length - 1
                  ).eleme,
            time:
              index >= time[1]
                ? variables[time[1]][variables[index].indexOf(foundElement)]
                : variables[time[0]][variables[index].indexOf(foundElement)],
            // column: variables[index].indexOf(foundElement),
            room: element[0],
          });
        });
      }
    });
  }

  return foundItem;
}

async function getAllSheetsData(params, sheetNumber = 0) {
  return new Promise(async (resolve, reject) => {
    if (sheetNumber && sheetNumber > 0) {
      return resolve(
        (await getCourses(params, sheetNumber)).slice(0).sort(function (a, b) {
          var [x, y] = [
            a.day.split(' ')[1].split('/').reverse().join(),
            b.day.split(' ')[1].split('/').reverse().join(),
          ];

          return x < y ? -1 : x > y ? 1 : 0;
        })
      );
    }
    let sheets = await getSheets();
    let allData = [];
    for (let index = 0; index < sheets.length; index++) {
      let myData = await getCourses(params, index + 1);
      allData.push(myData);
    }
    formattedData = allData
      .flat()
      .slice(0)
      .sort(function (a, b) {
        var [x, y] = [
          a.day.split(' ')[1].split('/').reverse().join(),
          b.day.split(' ')[1].split('/').reverse().join(),
        ];

        return x < y ? -1 : x > y ? 1 : 0;
      });

    return resolve(formattedData);
  });
}

function findCollidingLessons(lessons) {
  const collidingLessons = [];
  const groupedLessons = {};

  for (const lesson of lessons) {
    const key = lesson.day + lesson.time;
    if (groupedLessons[key]) {
      groupedLessons[key].push(lesson);
    } else {
      groupedLessons[key] = [lesson];
    }
  }

  for (const key in groupedLessons) {
    if (groupedLessons[key].length > 1) {
      collidingLessons.push(groupedLessons[key]);
    }
  }

  return collidingLessons;
}

module.exports = {
  Semester,
  getCourses,
  getSheets,
  getAllSheetsData,
  findCollidingLessons,
};
