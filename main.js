// modified from http://html5demos.com/file-api
const projects = new Map([
    ["mibnoBtns", 1],
    ["mibwBtns", 2],
    ["jlr", 3],
    ["ford", 2]
])

const fileNames = {
    "mibnoBtns": ["ROTATION PUSH"],
    "mibwBtns": ["PUSH", "ROTATION"],
    "jlr": ["Value_OPOE_Rot", "Value_Push_OPOE", "Value_ROT"],
    "ford": [".xml", ".xls"]
};

let excelArr = []
let numFiles = null
let project = null
let holder = document.getElementById('holder')
let section1 = document.querySelector("#section1")
let section2 = document.querySelector("#section2")
let section3 = document.querySelector("#section3")
let section4 = document.querySelector("#section4")

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

function sendProject(p) {
    project = p
    if (project != undefined){
        numFiles = projects.get(project)
		let spinner = document.querySelector(".spinner-border")
		spinner.style.visibility = "visible"
		setTimeout(()=> {section1.style.display = "none"
		spinner.style.visibility = "hidden"}, 1500)
        //return
    }
}

function getCorrectF(files) {
    let corrFiles = []
    fileNames[project].forEach( function(fileN) {
        for(let uploadedN of files){
            //console.log("porovnání", fileN, uploadedN.name)
            if (uploadedN.name.includes(fileN)){
                //console.log("shoda")
                corrFiles.push(uploadedN.name)
                break
            }
        }
    });
    return corrFiles
}

function writeF (file, index) {
    section2.style.display = "none"
	let parContent = document.querySelector("#file"+(index+1))
	let fileName = document.querySelector("#fileName"+(index+1))
	let reader = new FileReader();
	return new Promise((resolve) => {
	reader.onload = async function(event) {
		parContent.innerText = event.target.result;
		fileName.innerText = file.name;
        let fileMap
        if (file.name.includes("ROTATION PUSH")){
            fileMap = new Map([["pushAndRot", event.target.result]])
        } else if(file.name.includes("PUSH")){
            fileMap = new Map([["push", event.target.result]])
        } else if(file.name.includes("ROTATION")){
            fileMap = new Map([["rotation", event.target.result]])
        } else if(file.name.includes("Value_OPOE_Rot + Push_Volume")){
            fileMap = new Map([["opoeRotAndPush", event.target.result]])
		} else if(file.name.includes("Push_OPOE")){
            fileMap = new Map([["pushOpoe", event.target.result]])
		} else if(file.name.includes("Value_ROT _Volume")){
            fileMap = new Map([["rotVolume", event.target.result]])
		}else if(project==="ford"){
            fileMap = new Map([["xmlFord", event.target.result]])
		}
		resolve(fileMap)
	}
	reader.readAsText(file);})
}

function getResultXml(content){
    let linesArr = content.split("   ").filter(function(item) {return item != "" && item.includes("Value") || item.includes("SN")})
    linesArr.forEach(function(item, index){
        linesArr[index] = item.replace("<Value>", "").replace("</Value>", "").replace(".", ",").trim()
		if (linesArr[index].includes("SN")){
			linesArr[index] = item.slice(item.indexOf('SN="'), -1);
			const indexOfFirst = linesArr[index].indexOf('"');
			const last = linesArr[index].indexOf('"', (indexOfFirst + 1))
			linesArr[index] = "SN" + linesArr[index].slice(linesArr[index].indexOf('"') + 1, last);
		}
    })
    return linesArr
}

function getResultJlr(content){
	let linesArr = content.split("\n").filter(function(item) {return item.includes("PUBLIC") || item.includes("PRIVATE")})
    linesArr.forEach((elem, index) => {
        if(index === 0){
            let snArr = elem.split(";", 3)
            linesArr[index] = "SN"+ snArr[2].trim()
        }else{
            let valArr = elem.split(";", 3)
            linesArr[index] = valArr[2].trim().replace(".", ",")
        }
    });
	return linesArr
}

function createObj(firstArr, secondArr, thirdArr){
    let finalRes = {}
    const orderArr = (arr)=> {
        let key;
        for(let item of arr) {
            if (item.includes("SN")){
                key = item
                if (finalRes[key] === undefined){
                    finalRes[key] = []
                    continue
                }
                continue
            }
            finalRes[key].push(item)
        };
    }
    orderArr(firstArr)
    if (secondArr === undefined){
        return finalRes
    }else if (secondArr != undefined && thirdArr === undefined){
        orderArr(secondArr)
        return finalRes
    }else if (thirdArr != undefined){
        orderArr(secondArr)
        orderArr(thirdArr)
        return finalRes
    }
}

function orderResultFord(fordObj, excel){
    let SNnum = excel[0]["'SN'"]
    let leftFric = (((Number(excel[1]["'PFH_MEAN:Value'"]) * 1000) + (Number(excel[1]["'PBL_MEAN:Value'"] * 1000))) / 2).toFixed(2)
    let leftTorqCW = ((Number(excel[1]["'PFH_MEAN:Value'"]) * 1000) - (Number(excel[1]["'PFL_MEAN:Value'"] * 1000))).toFixed(2)
    let leftTorqCCW = ((Number(excel[1]["'PBH_MEAN:Value'"]) * 1000) - (Number(excel[1]["'PBL_MEAN:Value'"] * 1000))).toFixed(2)
    let rightFric = (((Number(excel[1]["'PFH_MEAN:Value'"]) * 1000) + (Number(excel[1]["'PBL_MEAN:Value'"] * 1000))) / 2).toFixed(2)
    let rightTorqCW = ((Number(excel[1]["'PFH_MEAN:Value'"]) * 1000) - (Number(excel[1]["'PFL_MEAN:Value'"] * 1000))).toFixed(2)
    let rightTorqCCW = ((Number(excel[1]["'PBH_MEAN:Value'"]) * 1000) - (Number(excel[1]["'PBL_MEAN:Value'"] * 1000))).toFixed(2)
    let excelArr = [leftFric, leftTorqCW, leftTorqCCW, rightFric, rightTorqCW, rightTorqCCW]
    excelArr.forEach((num, index) => {
        excelArr[index] = String(num).replace(".", ",")
    });
    console.log(excelArr)
    fordObj["SN"+SNnum] = [].concat(fordObj["SN"+SNnum], excelArr);
    console.log(fordObj["SN"+SNnum])
    return fordObj
} 

function orderResultJlr(obj){
    const keys = Object.keys(obj)
    let key = keys[0]
    obj[key] = ["30", "12", obj[key][12], obj[key][0], obj[key][2], obj[key][6], obj[key][4], obj[key][8], obj[key][10], "30", "12", obj[key][13], obj[key][1], 
    obj[key][3], obj[key][7], obj[key][5], obj[key][9], obj[key][11], "30", "12", obj[key][19], obj[key][14], obj[key][16], obj[key][15], obj[key][18]]
    return obj
}

function showResult(resObj) {
    section4.scrollIntoView()
    let snKeys = Object.keys(resObj).reverse()
    let parentDiv = document.querySelector("#accordion")
    let counter = 1
    let collapse = "collapse show"
    let values = (array) => {
        //console.log(array, "arrrr")
        let inHTML = "" 
        for(let num of array){
            inHTML += `${num}  <br>`
        }
        return inHTML
    }
    for(let key of snKeys){
        let card = `
		<div class="card">
          <div class="card-header bg-dark ">
            <a class="btn text-light" data-bs-toggle="collapse" href="#collapse${counter}">
             SN ${key.slice(2)} 
            </a>
            <span class='copyIcon fa fa-copy'"></span>
          </div>
          <div id="collapse${counter}" class="${collapse}" data-bs-parent="#accordion"> 
            <div class="card-body">
            ${values(resObj[key])}
            </div>
          </div>
        </div>`;
        parentDiv.innerHTML = parentDiv.innerHTML + card;
        counter++;
        collapse = "collapse"
		
	let btns = document.getElementsByClassName('copyIcon');
	for (i of btns) {
	  i.addEventListener('click', function() {
		let elemValues = this.parentElement.nextElementSibling.firstElementChild
		copyToClipboard(elemValues)
	  });
	}
	}
}

function copyToClipboard(elemCopy) {
  const textarea = document.createElement('textarea')
  textarea.id = 'temp_element'
  textarea.style.height = 0
  document.body.appendChild(textarea)
  textarea.value = elemCopy.innerText
  const selector = document.querySelector('#temp_element')
  selector.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function refresh(){
    let parFile1 = document.querySelector("#file1") 
    let parFile2 = document.querySelector("#file2") 
    let parFile3 = document.querySelector("#file3") 
    numFiles = null
    section1.style.display = section2.style.display = section3.style.display = "block"
    parFile1.innerHTML = parFile2.innerHTML = parFile3.innerHTML = ""
	let cardDiv = document.querySelector("#accordion")
	cardDiv.innerHTML = ""
}

holder.ondragover = function() {
    this.className = 'hover';
    return false;
};

function excelToObj(file){
    this.parseExcel = function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var data = e.target.result;
          var workbook = XLSX.read(data, {
            type: 'binary'
          });
          workbook.SheetNames.forEach(function(sheetName) {
            // Here is your object
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            excelArr.push(XL_row_object[0])
          })
        };
        reader.readAsBinaryString(file);
      };
    };


holder.ondrop = async function(e) {
    errorWrongFiles.style.display = "none";
    errorWrongFiles.style.display = "none";
    this.className = '';
    e.preventDefault();
    let files = e.dataTransfer.files
    uploadedF = files.length
    if (numFiles != files.length){
        let errorNumFiles = document.querySelector("#errorNumFiles")   // málo filů
        errorNumFiles.style.display = "inline";
        return
    }
    let corrFiles = getCorrectF(files)
    if (corrFiles.length != files.length) {
        let errorWrongFiles = document.querySelector("#errorWrongFiles")   //nahrané špatné soubory
        errorWrongFiles.style.display = "inline";
        return
    }
    let fileXls, fileXml
    if(project==="ford"){
        if(files[0].name.includes(".xls")){
            fileXls = files[0]
            fileXml = files[1]
        }else{
            fileXls = files[1]
            fileXml = files[0]
        }
        excelToObj(fileXls)
        let xl2json = new excelToObj();
        xl2json.parseExcel(fileXls);
    }
	let index = 0;
	const contOfFiles = new Object()
    if(project==="ford"){
        content = await writeF(fileXml, index);
        let proto = content.keys().next().value
        contOfFiles[proto] = content.get(proto)
    }else{
        for (let file of files){
            content = await writeF(file, index);
            let proto = content.keys().next().value
            contOfFiles[proto] = content.get(proto)
            index++;
        }
    }
    let resultFile = {}
    switch (project) {
        case "mibnoBtns":
            let resFileNoBtns = getResultXml(contOfFiles.pushAndRot)
            resultFile = createObj(resFileNoBtns)
            break;
        case "mibwBtns":
			let resFileWBtns1 = getResultXml(contOfFiles.push)
			let resFileWBtns2 = getResultXml(contOfFiles.rotation)
			resultFile = createObj(resFileWBtns1, resFileWBtns2)
            break;
        case "jlr":
            let resFileJlr1 = getResultJlr(contOfFiles.pushOpoe)
			let resFileJlr2 = getResultJlr(contOfFiles.opoeRotAndPush)
			let resFileJlr3 = getResultJlr(contOfFiles.rotVolume)
			resultFile = createObj(resFileJlr1, resFileJlr2, resFileJlr3)
            console.log(resultFile, "result fileeeee")
            resultFile = orderResultJlr(resultFile)
            break;
        case "ford":
            let resFileXml = getResultXml(contOfFiles.xmlFord)
            let resultFileXml = createObj(resFileXml)
            resultFile = orderResultFord(resultFileXml, excelArr)
            break;
      }
	console.log(resultFile, "res celkem")	
	showResult(resultFile)
};  

