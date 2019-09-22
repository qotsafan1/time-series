var invalidObservations = [];
//2016-09-05T18:13:46.105Z
var strictIsoParse;

function processData(timezone, unFilteredData) {
    timezone = "1";
    childGraphs = [];
    var dataObj = [];
    dataObj["byMonth"] = [];
    dataObj["byDay"] = [];
    dataObj["byWeek"] = [];
    dataObj['firstMonth'] = 12;
    dataObj['lastMonth'] = 1;
    dataObj['firstYear'] = 2030;
    dataObj['lastYear'] = 1000;
    dataObj['maxHourOfDay'] = 0;
    dataObj['lastRecordedDay'] = new Date("1971-1-1");
    dataObj['firstRecordedDay'] = new Date("2050-1-1");
    dataObj['recordsEachDayAndHour'] = [];
    dataObj['recordsEachWeek'] = [];
    dataObj['allRecordsEachDayAndHour'] = [];
    dataObj['sessions'] = [];

    dataObj['filteredData'] = [];

    dataObj['invalidatedObservations'] = [];
    dataObj['singleInvalidatedObservations'] = [];
    dataObj['hourToMarkAsChanged'] = [];
    dataObj['totalDaysWithObservations'] = 0;
    dataObj['sessionDates'] = [];

    var lastLoopedDay;
    var lastRecordDate = new Date("1971-1-1");

    var countMonth = [];
    var countWeekday = [];
    for (var i in weekday) {
        countWeekday[weekday[i]] = 0;
    }

    var countHour = [];
    var countEachDay = [];
    var countWeeks = [];
    var countEachMonth = [];
    var countEachHourOfEachWeek = [];
    var countEachHourOfEachDay = [];
    var countEachHourOfEachWeekday = [];
    var countStackedTwoHoursOfEachDay = [];
    var countStackedThreeHoursOfEachDay = [];
    var countStackedFourHoursOfEachDay = [];
    var countStackedSixHoursOfEachDay = [];
    var countStackedEightHoursOfEachDay = [];
    var session = [];
    var currentSession = 0;

    for (var i=0; i<24;i++) {
        countHour[i] = 0;
    }

    for (var d in weekday) {
        countEachHourOfEachWeekday[d] = [];
        for (var i=0; i<24; i++) {
            countEachHourOfEachWeekday[d][i] = 0;
        }
    }
console.log(unFilteredData)
    for (var instance in unFilteredData) {
        var date = Object.keys(unFilteredData[instance])[0]
        if (date !== "date") {
            continue;
        }

        if (!unFilteredData[instance][date].includes("-")) {
            strictIsoParse = d3.utcParse("%Y%m%dT%H%M%SZ");
        } else {
            strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
        }

        var isoDate = strictIsoParse(unFilteredData[instance][date]);
        if (!isoDate || isoDate === null || isoDate === "") {
            continue;
        }

        if (timezone === "2" && "timezone" in unFilteredData[instance]) {
            var tzString = unFilteredData[instance]["timezone"];
            if (tzString.includes("+")) {
                isoDate.setUTCHours(isoDate.getUTCHours() + parseInt(tzString.slice(1,3)));
            } else if (tzString.includes("-")) {
                isoDate.setUTCHours(isoDate.getUTCHours() - parseInt(tzString.slice(1,3)));
            }
        }

        if (timezone === "1") {
            thisTZDate = new Date(isoDate.getTime())
            isoDate.setUTCMinutes(isoDate.getUTCMinutes() + (-1*thisTZDate.getTimezoneOffset()));
        }

        var dayOfMonth = isoDate.getUTCFullYear() + "-" + (isoDate.getUTCMonth()+1) + "-" + isoDate.getUTCDate();
        var hourOfDay = dayOfMonth + "-" +isoDate.getUTCHours();
        var millisecondString = hourOfDay + "-" +isoDate.getUTCMilliseconds();


        if (sessions.length > 0) {
            if (currentSession < sessions.length) {
                var sessionDate = new Date(sessions[currentSession].sessionDate)
                if (sessionDate.getTime() <= getCorrectUTCDate(dayOfMonth).getTime()) {
                    currentSession++;
                    dataObj["sessions"].push(session);
                    session = [];
                }
            }
        }
        session.push(rawData[instance]);

        if (isoDate > dataObj['lastRecordedDay']) {
            dataObj['lastRecordedDay'] = isoDate;
        }

        if (isoDate < dataObj['firstRecordedDay']) {
            dataObj['firstRecordedDay'] = isoDate;
        }

        if (isoDate.getUTCFullYear() < dataObj['firstYear']) {
            dataObj['firstYear'] = isoDate.getUTCFullYear();
        }
        if (isoDate.getUTCFullYear() > dataObj['lastYear']) {
            dataObj['lastYear'] = isoDate.getUTCFullYear();
        }

        if (isoDate.getUTCFullYear() === dataObj['firstYear']) {
            //Find first and last month
            if (isoDate.getUTCMonth() < dataObj["firstMonth"]) {
                dataObj["firstMonth"] = isoDate.getUTCMonth();
            }
        }
        if (isoDate.getUTCFullYear() === dataObj['lastYear']) {
            if (isoDate.getUTCMonth() > dataObj["lastMonth"]) {
                dataObj["lastMonth"] = isoDate.getUTCMonth();
            }
        }



        if (dayOfMonth in dataObj['allRecordsEachDayAndHour']) {
            dataObj['allRecordsEachDayAndHour'][dayOfMonth][isoDate.getUTCHours()].push(isoDate);
        } else {
            dataObj['totalDaysWithObservations']++;
            dataObj['allRecordsEachDayAndHour'][dayOfMonth] = [];
            for (var i=0; i<24; i++) {
                dataObj['allRecordsEachDayAndHour'][dayOfMonth][i] = [];
            }
            dataObj['allRecordsEachDayAndHour'][dayOfMonth][isoDate.getUTCHours()].push(isoDate);
        }

        if (millisecondString in invalidObservations) {
            dataObj['singleInvalidatedObservations'][millisecondString] = invalidObservations[millisecondString];
            dataObj['hourToMarkAsChanged'][hourOfDay] = true;
            continue;
        }

        if (dayOfMonth in invalidObservations) {
            if (!(dayOfMonth in dataObj['invalidatedObservations'])) {
                dataObj['invalidatedObservations'][dayOfMonth] = 0;
            }
            dataObj['invalidatedObservations'][dayOfMonth]++;

            if (!(hourOfDay in dataObj['invalidatedObservations'])) {
                dataObj['invalidatedObservations'][hourOfDay] = 0;
            }
            dataObj['invalidatedObservations'][hourOfDay]++;
            continue;
        }

        if (hourOfDay in invalidObservations) {
            if (!(hourOfDay in dataObj['invalidatedObservations'])) {
                dataObj['invalidatedObservations'][hourOfDay] = 0;
            }
            dataObj['invalidatedObservations'][hourOfDay]++;
            continue;
        }
        var diff = isoDate.getTime() - lastRecordDate.getTime();
        if (diff > 4000) {
            dataObj['filteredData'].push(isoDate);
            lastRecordDate = isoDate;
        }

        // count days and weeks that don't appear in dataset
        if (lastLoopedDay) {
            var tempDate = new Date(isoDate.getTime());
            tempDate.setUTCHours(0,0,0,0);
            if ((tempDate.getTime() - lastLoopedDay.getTime()) > 86400000) {
                while(lastLoopedDay.getTime() < tempDate.getTime()) {
                    var tempDay = lastLoopedDay.getUTCFullYear() + "-" + (lastLoopedDay.getUTCMonth()+1) + "-" + lastLoopedDay.getUTCDate();
                    var tempWeek = lastLoopedDay.getWeekNumber() + "-" + lastLoopedDay.getUTCFullYear();
                    if (!(tempDay in countEachDay)) {
                        countEachDay[tempDay] = 0;
                    }

                    if (!(tempWeek in countWeeks)) {
                        countWeeks[tempWeek] = 0;
                    }
                    lastLoopedDay.setUTCDate(lastLoopedDay.getUTCDate() + 1);
                }
            }
        }

        // calculate stacked bars
        if (!(dayOfMonth in countStackedTwoHoursOfEachDay)) {
            countStackedTwoHoursOfEachDay[dayOfMonth] = [];
            countStackedTwoHoursOfEachDay[dayOfMonth][0] = 0;
            countStackedTwoHoursOfEachDay[dayOfMonth][1] = 0;
        }

        if (isoDate.getUTCHours() < 12) {
            countStackedTwoHoursOfEachDay[dayOfMonth][0]++;
        } else {
            countStackedTwoHoursOfEachDay[dayOfMonth][1]++;
        }

        if (!(dayOfMonth in countStackedThreeHoursOfEachDay)) {
            countStackedThreeHoursOfEachDay[dayOfMonth] = [];
            for (var i=0; i<3; i++) {
                countStackedThreeHoursOfEachDay[dayOfMonth][i] = 0;
            }
        }
        if (isoDate.getUTCHours() < 9) {
            countStackedThreeHoursOfEachDay[dayOfMonth][0]++;
        } else if (isoDate.getUTCHours() >= 9 && isoDate.getUTCHours() < 18) {
            countStackedThreeHoursOfEachDay[dayOfMonth][1]++;
        } else {
            countStackedThreeHoursOfEachDay[dayOfMonth][2]++;
        }

        if (!(dayOfMonth in countStackedFourHoursOfEachDay)) {
            countStackedFourHoursOfEachDay[dayOfMonth] = [];
            for (var i=0; i<4; i++) {
                countStackedFourHoursOfEachDay[dayOfMonth][i] = 0;
            }
        }
        if (isoDate.getUTCHours() < 6) {
            countStackedFourHoursOfEachDay[dayOfMonth][0]++;
        } else if (isoDate.getUTCHours() >= 6 && isoDate.getUTCHours() < 12) {
            countStackedFourHoursOfEachDay[dayOfMonth][1]++;
        } else if (isoDate.getUTCHours() >= 12 && isoDate.getUTCHours() < 18) {
            countStackedFourHoursOfEachDay[dayOfMonth][2]++;
        } else {
            countStackedFourHoursOfEachDay[dayOfMonth][3]++;
        }

        // calculate stacked bars
        if (!(dayOfMonth in countStackedSixHoursOfEachDay)) {
            countStackedSixHoursOfEachDay[dayOfMonth] = [];
            for (var i=0; i<6; i++) {
                countStackedSixHoursOfEachDay[dayOfMonth][i] = 0;
            }
        }
        if (isoDate.getUTCHours() < 4) {
            countStackedSixHoursOfEachDay[dayOfMonth][0]++;
        } else if (isoDate.getUTCHours() >= 4 && isoDate.getUTCHours() < 8) {
            countStackedSixHoursOfEachDay[dayOfMonth][1]++;
        } else if (isoDate.getUTCHours() >= 8 && isoDate.getUTCHours() < 12) {
            countStackedSixHoursOfEachDay[dayOfMonth][2]++;
        } else if (isoDate.getUTCHours() >= 12 && isoDate.getUTCHours() < 16) {
            countStackedSixHoursOfEachDay[dayOfMonth][3]++;
        } else if (isoDate.getUTCHours() >= 16 && isoDate.getUTCHours() < 20) {
            countStackedSixHoursOfEachDay[dayOfMonth][4]++;
        } else {
            countStackedSixHoursOfEachDay[dayOfMonth][5]++;
        }

        // calculate stacked bars
        if (!(dayOfMonth in countStackedEightHoursOfEachDay)) {
            countStackedEightHoursOfEachDay[dayOfMonth] = [];
            for (var i=0; i<8; i++) {
                countStackedEightHoursOfEachDay[dayOfMonth][i] = 0;
            }
        }
        if (isoDate.getUTCHours() < 3) {
            countStackedEightHoursOfEachDay[dayOfMonth][0]++;
        } else if (isoDate.getUTCHours() >= 3 && isoDate.getUTCHours() < 6) {
            countStackedEightHoursOfEachDay[dayOfMonth][1]++;
        } else if (isoDate.getUTCHours() >= 6 && isoDate.getUTCHours() < 9) {
            countStackedEightHoursOfEachDay[dayOfMonth][2]++;
        } else if (isoDate.getUTCHours() >= 9 && isoDate.getUTCHours() < 12) {
            countStackedEightHoursOfEachDay[dayOfMonth][3]++;
        } else if (isoDate.getUTCHours() >= 12 && isoDate.getUTCHours() < 15) {
            countStackedEightHoursOfEachDay[dayOfMonth][4]++;
        } else if (isoDate.getUTCHours() >= 15 && isoDate.getUTCHours() < 18) {
            countStackedEightHoursOfEachDay[dayOfMonth][5]++;
        } else if (isoDate.getUTCHours() >= 18 && isoDate.getUTCHours() < 21) {
            countStackedEightHoursOfEachDay[dayOfMonth][6]++;
        } else {
            countStackedEightHoursOfEachDay[dayOfMonth][7]++;
        }

        var currentWeek = isoDate.getWeekNumber() + "-" + isoDate.getUTCFullYear();
        if (isoDate.getWeekNumber() === 52 && isoDate.getUTCDate() < 7) {
            var possibleDifferentWeek = isoDate.getWeekNumber() + "-" + (isoDate.getUTCFullYear()-1);
            if (possibleDifferentWeek in countWeeks) {
                currentWeek = possibleDifferentWeek;
            }
        }
        sumData(currentWeek, countWeeks);

        if (!(currentWeek in dataObj['recordsEachWeek'])) {
            dataObj['recordsEachWeek'][currentWeek] = [];
        }
        dataObj['recordsEachWeek'][currentWeek].push(unFilteredData[instance]);

        var currentMonth = month[isoDate.getUTCMonth()]
        sumData(currentMonth, countMonth);

        sumData((isoDate.getUTCMonth()+"-"+isoDate.getUTCFullYear()), countEachMonth);

        var currentDay = isoDate.getUTCDay() === 0 ? weekday[6] : weekday[(isoDate.getUTCDay()-1)];

        sumData(currentDay, countWeekday);
        sumData(isoDate.getUTCHours(), countHour);

        if (dayOfMonth in countEachDay) {
            countEachDay[dayOfMonth]++;
        } else {
            countEachDay[dayOfMonth] = 1;
        }

        // sum of each hour of each day
        if (hourOfDay in countEachHourOfEachDay) {
            countEachHourOfEachDay[hourOfDay]++;
        } else {
            countEachHourOfEachDay[hourOfDay] = 1;
        }

        // sum of each hour of each weekday
        countEachHourOfEachWeekday[isoDate.getUTCDay() === 0 ? 6 : (isoDate.getUTCDay()-1)][isoDate.getUTCHours()]++;

        if (dayOfMonth in dataObj['recordsEachDayAndHour']) {
            dataObj['recordsEachDayAndHour'][dayOfMonth][isoDate.getUTCHours()].push(isoDate);
        } else {
            dataObj['recordsEachDayAndHour'][dayOfMonth] = [];
            for (var i=0; i<24; i++) {
                dataObj['recordsEachDayAndHour'][dayOfMonth][i] = [];
            }
            dataObj['recordsEachDayAndHour'][dayOfMonth][isoDate.getUTCHours()].push(isoDate);
        }

        // sum of each hour of each week
        if (currentWeek in countEachHourOfEachWeek) {
            countEachHourOfEachWeek[currentWeek][isoDate.getUTCHours()]++;
        } else {
            countEachHourOfEachWeek[currentWeek] = [];
            for (var i=0; i<24; i++) {
                countEachHourOfEachWeek[currentWeek][i] = 0;
            }
            countEachHourOfEachWeek[currentWeek][isoDate.getUTCHours()]++;
        }

        lastLoopedDay = new Date(isoDate.getTime());
        lastLoopedDay.setUTCHours(0,0,0,0);
    }

    dataObj["sessions"].push(session);

    dataObj['firstObservation'] = dataObj['firstRecordedDay'];
    dataObj['firstRecordedDay'] = new Date(dataObj['firstRecordedDay'].getTime());
    dataObj['firstRecordedDay'].setUTCHours(0,0,0,0);
    dataObj['lastObservation'] = dataObj['lastRecordedDay'];
    dataObj['lastRecordedDay'] = new Date(dataObj['lastRecordedDay'].getTime());
    dataObj['lastRecordedDay'].setUTCHours(23,59,59);
    dataObj['byMonth'] = createBarData(countMonth);
    dataObj['byDay'] = createBarData(countWeekday);
    dataObj['byHour'] = createBarData(countHour);
    dataObj['byWeek'] = createBarData(countWeeks);
    dataObj['sumOfEachMonth'] = countMonth;
    dataObj['sumOfEachYearMonth'] = createBarData(countEachMonth);
    dataObj['sumOfEachWeek'] = countWeeks;
    dataObj['sumOfEachDay'] = countEachDay;
    dataObj['hourByDay'] = countEachHourOfEachDay;
    dataObj['hourByWeek'] =  countEachHourOfEachWeek;
    dataObj['amountOfEachWeekday'] = getCountOfEachWeekday(dataObj['firstRecordedDay'], dataObj['lastRecordedDay']);
    dataObj['eachDay'] = [];

    for(var i in countEachDay) {
        dataObj['eachDay'].push({
            "date": getCorrectUTCDate(i),
            "sum": countEachDay[i]
        });
    }

    for (var i in countEachHourOfEachDay) {
        if (countEachHourOfEachDay[i] > dataObj['maxHourOfDay']) {
            dataObj['maxHourOfDay'] = countEachHourOfEachDay[i];
        }
    }

    dataObj["stackedHoursEachDay"] = [];
    dataObj["stackedHoursEachDay"][0] = [];
    dataObj["stackedHoursEachDay"][1] = [];
    dataObj["stackedHoursEachDay"][2] = [];
    dataObj["stackedHoursEachDay"][3] = [];
    dataObj["stackedHoursEachDay"][4] = [];
    for (var i in countStackedTwoHoursOfEachDay) {
        dataObj["stackedHoursEachDay"][0].push({
            "date": getCorrectUTCDate(i),
            "00-12": countStackedTwoHoursOfEachDay[i][0],
            "12-00": countStackedTwoHoursOfEachDay[i][1]
        });
    }
    for (var i in countStackedThreeHoursOfEachDay) {
        dataObj["stackedHoursEachDay"][1].push({
            "date": getCorrectUTCDate(i),
            "00-09": countStackedThreeHoursOfEachDay[i][0],
            "09-18": countStackedThreeHoursOfEachDay[i][1],
            "18-00": countStackedThreeHoursOfEachDay[i][2]
        });
    }
    for (var i in countStackedFourHoursOfEachDay) {
        dataObj["stackedHoursEachDay"][2].push({
            "date": getCorrectUTCDate(i),
            "00-06": countStackedFourHoursOfEachDay[i][0],
            "06-12": countStackedFourHoursOfEachDay[i][1],
            "12-18": countStackedFourHoursOfEachDay[i][2],
            "18-00": countStackedFourHoursOfEachDay[i][3]
        });
    }
    for (var i in countStackedSixHoursOfEachDay) {
        dataObj["stackedHoursEachDay"][3].push({
            "date": getCorrectUTCDate(i),
            "00-04": countStackedSixHoursOfEachDay[i][0],
            "04-08": countStackedSixHoursOfEachDay[i][1],
            "08-12": countStackedSixHoursOfEachDay[i][2],
            "12-16": countStackedSixHoursOfEachDay[i][3],
            "16-20": countStackedSixHoursOfEachDay[i][4],
            "20-00": countStackedSixHoursOfEachDay[i][5]
        });
    }
    for (var i in countStackedEightHoursOfEachDay) {
        dataObj["stackedHoursEachDay"][4].push({
            "date": getCorrectUTCDate(i),
            "00-03": countStackedEightHoursOfEachDay[i][0],
            "03-06": countStackedEightHoursOfEachDay[i][1],
            "06-09": countStackedEightHoursOfEachDay[i][2],
            "09-12": countStackedEightHoursOfEachDay[i][3],
            "12-15": countStackedEightHoursOfEachDay[i][4],
            "15-18": countStackedEightHoursOfEachDay[i][5],
            "18-21": countStackedEightHoursOfEachDay[i][6],
            "21-24": countStackedEightHoursOfEachDay[i][7]
        });
    }
    dataObj["sumStackedHoursEachDay"] = []
    dataObj["sumStackedHoursEachDay"][0] = countStackedFourHoursOfEachDay;
    dataObj["sumStackedHoursEachDay"][1] = countStackedSixHoursOfEachDay;
    dataObj["sumStackedHoursEachDay"][2] = countStackedTwoHoursOfEachDay;
    dataObj["sumStackedHoursEachDay"][3] = countStackedEightHoursOfEachDay;

    console.log(dataObj)
    dataObj['mostInADay'] = d3.max(dataObj['eachDay'],function(d) { return d.sum});
    dataObj['leastInADay'] = d3.min(dataObj['eachDay'],function(d) { return d.sum});

    dataObj['totalDays'] = getNumberOfDayBetweenTwoDates(dataObj['firstRecordedDay'], dataObj['lastRecordedDay']);
    dataObj['averagePerHour'] = [];
    for (var hour in countHour) {
        dataObj['averagePerHour'][hour] = (countHour[hour]/dataObj['totalDays']);
    }

    dataObj['byAverageHour'] = createBarData(dataObj['averagePerHour']);

    dataObj['averageDay'] = (d3.sum(dataObj['eachDay'],function(d) { return d.sum})/dataObj['totalDays']);

    dataObj['averageWorkday'] = (dataObj['byDay'][0].sum + dataObj['byDay'][1].sum + dataObj['byDay'][2].sum +dataObj['byDay'][3].sum + dataObj['byDay'][4].sum) / (dataObj['totalDays']-dataObj['amountOfEachWeekday'][5]-dataObj['amountOfEachWeekday'][6]);
    dataObj['averageWeekend'] = (dataObj['byDay'][5].sum + dataObj['byDay'][6].sum) / (dataObj['amountOfEachWeekday'][5]+dataObj['amountOfEachWeekday'][6]);

    dataObj['averagePerWeekday'] = [];
    dataObj['byAverageWeekday'] = [];
    for (var i=0;i<7;i++) {
        var averageWeekday = dataObj['byDay'][i].sum/dataObj['amountOfEachWeekday'][i];
        dataObj['averagePerWeekday'][i] = averageWeekday;
        dataObj['byAverageWeekday'].push({
            sum: (isNaN(averageWeekday.toFixed(2)) ? 0 : parseFloat(averageWeekday.toFixed(2))),
            type: weekday[i]
        })
    }

    dataObj["averagePerHourPerWeekday"] = [];
    for (var d in weekday) {
        dataObj["averagePerHourPerWeekday"][d] = [];
        for (var i=0; i<24; i++) {
            dataObj["averagePerHourPerWeekday"][d][i] = countEachHourOfEachWeekday[d][i]/dataObj['amountOfEachWeekday'][d];
        }
    }

    dataObj["averageHourOverAllWeeks"] = [];
    dataObj["maxHourOverAllWeeks"] = 0;
    for (var i=0; i<24; i++) {
        var hourSum = 0;
        var numWeeks = 0;
        var currentWeek;
        for (var w in countEachHourOfEachWeek) {
            hourSum += countEachHourOfEachWeek[w][i];
            numWeeks++;

            if (countEachHourOfEachWeek[w][i] > dataObj["maxHourOverAllWeeks"]) {
                dataObj["maxHourOverAllWeeks"] = countEachHourOfEachWeek[w][i];
            }
        }

        dataObj["averageHourOverAllWeeks"][i] = hourSum/numWeeks;
    }

    dataObj["daysInEachWeek"] = getDaysInEachWeek(dataObj['firstRecordedDay'], dataObj['lastRecordedDay']);
    dataObj["maxWeek"] = 0;
    dataObj["averageDayPerWeek"] = [];
    var weekSum = 0;
    var amountOfWeeks = 0;
    for (var i in countWeeks) {

        if (countWeeks[i] > dataObj["maxWeek"]) {
            dataObj["maxWeek"] = countWeeks[i];
        }
        weekSum += countWeeks[i];
        amountOfWeeks++;

        var daysInCurrentWeek = (dataObj["daysInEachWeek"][i].lastDay.getUTCDay() === 0 ? 6 : (dataObj["daysInEachWeek"][i].lastDay.getUTCDay()-1))
            - (dataObj["daysInEachWeek"][i].firstDay.getUTCDay() === 0 ? 6 : (dataObj["daysInEachWeek"][i].firstDay.getUTCDay()-1))
             + 1;
        dataObj["averageDayPerWeek"][i] = countWeeks[i]/daysInCurrentWeek;
    }
    dataObj["averageWeek"] = (weekSum/amountOfWeeks);

    dataObj["byAverageDayPerWeek"] = createBarData(dataObj["averageDayPerWeek"]);

    dataObj["averageDayPerMonth"] = [];
    dataObj["averageDayEachMonth"] = [];
    dataObj["maxAverageDayPerMonth"] = 0;
    var amountOfDaysInFirstMonth = daysInMonth(dataObj['firstRecordedDay'].getUTCMonth(), dataObj['firstRecordedDay'].getUTCFullYear()) - dataObj['firstRecordedDay'].getUTCDate()+1;
    var amountOfDaysInLastMonth = dataObj['lastRecordedDay'].getUTCDate();
    var cnt = 0;
    for (var i in countMonth) {
        var sum = 0;
        if (cnt === 0) {
            sum = +(countMonth[i] / amountOfDaysInFirstMonth).toFixed(2);
        } else if (cnt === (Object.keys(countMonth).length-1)) {
            sum = +(countMonth[i] / amountOfDaysInLastMonth).toFixed(2);
        } else {
            sum= +(countMonth[i] / daysInMonth((month.indexOf(i)+1), dataObj["firstYear"])).toFixed(2);
        }

        if (dataObj["maxAverageDayPerMonth"] < sum) {
            dataObj["maxAverageDayPerMonth"] = Math.floor(sum);
        }

        dataObj["averageDayEachMonth"][i] = sum;

        dataObj["averageDayPerMonth"].push({
            sum: sum,
            type: i
        });
        cnt++;
    }

    dataObj['recordsEachWeekAsObject'] = [];
    for (var i in dataObj['recordsEachWeek']) {
        dataObj['recordsEachWeekAsObject'].push({
            "week": i,
            "records": dataObj['recordsEachWeek'][i]
        });
    }

    if (sessions.length > 0) {
        for (var i in sessions) {
            var sessionDate = new Date(sessions[i].sessionDate);
            dataObj['sessionDates'].push((sessionDate.getUTCFullYear() +"-"+ (sessionDate.getUTCMonth()+1) +"-"+ sessionDate.getUTCDate()));
        }
    }

    dataObj["trivia"] = [];
    dataObj["trivia"].push({
        "key": "First observation",
        "value": dataObj["firstObservation"].getUTCDate()
            + " " + month[dataObj["firstObservation"].getUTCMonth()]
            + " " + dataObj["firstObservation"].getUTCFullYear()
            + " " + (dataObj["firstObservation"].getUTCHours() < 10 ? "0" : "") + dataObj["firstObservation"].getUTCHours()
            +":"+ (dataObj["firstObservation"].getUTCMinutes() < 10 ? "0" : "") + dataObj["firstObservation"].getUTCMinutes()
            +":"+ (dataObj["firstObservation"].getUTCSeconds() < 10 ? "0" : "") + dataObj["firstObservation"].getUTCSeconds()
    });
    dataObj["trivia"].push({
        "key": "Last observation",
        "value": dataObj["lastObservation"].getUTCDate()
        + " " + month[dataObj["lastObservation"].getUTCMonth()]
        + " " + dataObj["lastObservation"].getUTCFullYear()
        + " " + (dataObj["lastObservation"].getUTCHours() < 10 ? "0" : "") + dataObj["lastObservation"].getUTCHours()
            +":"+ (dataObj["lastObservation"].getUTCMinutes() < 10 ? "0" : "") + dataObj["lastObservation"].getUTCMinutes()
            +":"+ (dataObj["lastObservation"].getUTCSeconds() < 10 ? "0" : "") + dataObj["lastObservation"].getUTCSeconds()
    });
    dataObj["trivia"].push({
        "key": "Total days",
        "value": dataObj["totalDays"]
    });
    dataObj["trivia"].push({
        "key": "Total weeks",
        "value": dataObj["byWeek"].length
    });
    dataObj["trivia"].push({
        "key": "Total months",
        "value": dataObj["sumOfEachYearMonth"].length
    });
    dataObj["trivia"].push({
        "key": "Total observations",
        "value": unFilteredData.length
    });
    dataObj["trivia"].push({
        "key": "Days with observations",
        "value": dataObj["totalDaysWithObservations"]
            + " (" + ((dataObj["totalDaysWithObservations"]/dataObj["totalDays"])*100).toFixed(2) + "% of total days)"
    });
    dataObj["trivia"].push({
        "key": "Days without observations",
        "value": dataObj["totalDays"] - dataObj["totalDaysWithObservations"]
            + " (" + (((dataObj["totalDays"] - dataObj["totalDaysWithObservations"])/dataObj["totalDays"])*100).toFixed(2) + "% of total days)"
    });
    dataObj["trivia"].push({
        "key": "Average observations per day",
        "value": dataObj["averageDay"].toFixed(2)
    });
    dataObj["trivia"].push({
        "key": "Average observations per week",
        "value": dataObj["averageWeek"].toFixed(2)
    });
    dataObj["trivia"].push({
        "key": "Most in a day",
        "value": dataObj["mostInADay"]
    });
    dataObj["trivia"].push({
        "key": "Most in an hour",
        "value": dataObj["maxHourOfDay"]
    });
    dataObj["trivia"].push({
        "key": "Least in a day",
        "value": (dataObj["totalDays"] - dataObj["totalDaysWithObservations"] === 0 ? dataObj["leastInADay"] : 0)
    });
    dataObj["trivia"].push({
        "key": "Least in an hour",
        "value": 0
    });

    return dataObj;
}

function getDaysInEachWeek(firstDay, lastDay) {
    var currentDay = new Date(firstDay.getTime());
    currentDay.setUTCHours(0,0,0,0);
    weekArray = [];
    while (currentDay.getTime() < lastDay.getTime()) {
        var weekString = currentDay.getWeekNumber() +"-"+ currentDay.getUTCFullYear();
        if (weekString in weekArray) {
            if (weekArray[weekString]["firstDay"].getTime() > currentDay.getTime()) {
                weekArray[weekString]["firstDay"] = new Date(currentDay.getTime());
            }

            if (weekArray[weekString]["lastDay"].getTime() < currentDay.getTime()) {
                weekArray[weekString]["lastDay"] = new Date(currentDay.getTime());
            }
        } else {
            weekArray[weekString] = [];
            weekArray[weekString]["firstDay"] = new Date(currentDay.getTime());
            weekArray[weekString]["lastDay"] = new Date(currentDay.getTime());
        }

        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }

    return weekArray;
}

function sumData(instance, sumArray) {
    if (instance in sumArray) {
        sumArray[instance]++;
    } else {
        sumArray[instance] = 1;
    }
}

function createBarData(countArray) {
    var barData = [];
    for (var i in countArray) {
        barData.push({
                "type": i,
                "sum": countArray[i]
        });
    }
    return barData;
}

function checkForChosenDataset() {
    var possibleDataset = window.sessionStorage.getItem('dataset');
    if (possibleDataset === 'custom') {
        var customDateString = parseInt(window.sessionStorage.getItem('custom-date'));
        var timeNow = new Date();
        if ((timeNow.getTime() - customDateString) < 1800000) {
            rawData = JSON.parse(window.sessionStorage.getItem('custom-data')).data
            dividedFactoredData = divideIntoClicks(rawData);
            factoredData = dividedFactoredData[0];
            dividedData = dividedFactoredData[1];
            annotations = [];
            invalidObservations = [];
            sessions = [];
            var tz = getTimezone();
            if (window.location.href.includes("multiple")) {
                data = processData(tz, factoredData);
            } else {
                data = processData(tz, rawData);
            }
            createVisualizations();
            window.sessionStorage.setItem('custom-date', timeNow.getTime());
        } else {
            window.sessionStorage.setItem('custom-data', "");
            window.sessionStorage.setItem('custom-date', "");
            window.sessionStorage.setItem('dataset', "");
        }
    }
}

function getTimezone() {
    var tz = window.sessionStorage.getItem('timezone');
    if (tz === null) {
      tz = "1";
    }
    return tz;
  }

function divideIntoClicks(unFilteredData) {
    var clicks = {
        one: [],
        two: [],
        three: []
    }    
    
    var clickBefore = null;
    var currentClicks = 0;
    var lastInstance = null;
    var allFactoredInstances = [];

    for (var instance in unFilteredData) {
        var date = Object.keys(unFilteredData[instance])[0]
        if (date !== "date") {
            continue;
        }

        if (!unFilteredData[instance][date].includes("-")) {
            strictIsoParse = d3.utcParse("%Y%m%dT%H%M%SZ");
        } else {
            strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
        }

        var isoDate = strictIsoParse(unFilteredData[instance][date]);
        if (!isoDate || isoDate === null || isoDate === "") {
            continue;
        }

        if (timezone === "2" && "timezone" in unFilteredData[instance]) {
            var tzString = unFilteredData[instance]["timezone"];
            if (tzString.includes("+")) {
                isoDate.setUTCHours(isoDate.getUTCHours() + parseInt(tzString.slice(1,3)));
            } else if (tzString.includes("-")) {
                isoDate.setUTCHours(isoDate.getUTCHours() - parseInt(tzString.slice(1,3)));
            }
        }

        if (timezone === "1") {
            thisTZDate = new Date(isoDate.getTime())
            isoDate.setUTCMinutes(isoDate.getUTCMinutes() + (-1*thisTZDate.getTimezoneOffset()));
        }

        if (!(clickBefore === null)) {
            if (isoDate.getTime()-clickBefore.getTime() < 2000) {
                currentClicks++;
            } else {
                if (currentClicks === 1) {
                    clicks.one.push(lastInstance);
                    allFactoredInstances.push(lastInstance);
                } else if (currentClicks === 2) {
                    clicks.two.push(lastInstance);
                    allFactoredInstances.push(lastInstance);
                } else if (currentClicks > 2) {
                    clicks.three.push(lastInstance);
                    allFactoredInstances.push(lastInstance);
                }
                currentClicks = 1;
            }
        } else {
            currentClicks = 1;
        }
        
        clickBefore  = new Date(isoDate.getTime());
        lastInstance = unFilteredData[instance];
    }

    console.log(clicks)
    console.log(allFactoredInstances);

    return [allFactoredInstances, clicks];
}
