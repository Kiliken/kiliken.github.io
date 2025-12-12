import enWorks from "../data/works.json" with { type: "json" };
import enConts from "../data/localEn.json" with { type: "json" };
import jpConts from "../data/localJp.json" with { type: "json" };

export function Works(page, type) {
	var jp = false;
	jp = (type == "jp" ? true : false);
	var data = enWorks;
	
	page *= 4;
    var wkDiv = document.getElementById('workscreen');
    wkDiv.innerHTML = '';
	let htmlContent = '';
	for (var i = page; i < page+4; i++) {
		
		if (i >= data.length)
			continue;
		
		if (i % 2 === 0) {
			htmlContent += `<div class="d-flex flex-column flex-md-row justify-content-between">`;
		}
		
		htmlContent += `
			<div class="flex-grow-1 m-1 p-1 border-bottom workItem" id="`+data[i]+`">
			<a class="" target=blank href="`+data[i].aboutEn+`" role="button">
			<img class="showcase-image" src="img/showcase/`+(data[i].img === "" ? "none.png" : data[i].img)+`" /></a>
            <h3 class="mb-0">`+data[i].title+`</h3>
            <div class="subheading mb-3">`+data[i].platform+`</div>
			</div>
			`;
		
		if (i % 2 === 1 || i === data.length - 1) {
            htmlContent += `</div>`;
        }
	}
	wkDiv.innerHTML = htmlContent;
}

export function AllWorks(type) {
	var jp = false;
	jp = (type == "jp" ? true : false);
	var data = enWorks;
	
    var wkDiv = document.getElementById('workscreen');
    wkDiv.innerHTML = '';
	let htmlContent = '';
	for (var i = 0; i < data.length; i++) {
		
		if (i >= data.length)
			continue;
		
		if (i % 2 === 0) {
			htmlContent += `<div class="d-flex flex-column flex-md-row justify-content-between">`;
		}
		
		
		htmlContent += `
			<div class="flex-grow-1 m-1 p-1 border-bottom workItem" id="`+data[i].title+data[i].platform+data[i].description+`">
			<a class="" target=blank href="`+data[i].aboutEn+`" role="button">
			<img class="showcase-image" src="img/showcase/`+(data[i].img === "" ? "none.png" : data[i].img)+`" /></a>
            <h3 class="mb-0">`+data[i].title+`</h3>
            <div class="subheading mb-3">`+data[i].platform+`</div>
			</div>
			`;
		
		if (i % 2 === 1 || i === data.length - 1) {
			htmlContent += `</div>`;
		}
	}
	
	wkDiv.innerHTML = htmlContent;
}

export function Localize(type) {
	var jp = false;
	jp = (type == "jp" ? true : false);
	var locDiv;
	var locConts = (jp ? jpConts : enConts);
	{
			locDiv = document.getElementById('aboutMe');
			locDiv.innerHTML = '';
			locDiv.innerHTML += locConts[0].conts;
		}
		{
			locDiv = document.getElementById('exp');
	for (var i = 0; i < locConts[1].conts.length; i++) {
		if (locConts[1].conts.length < i)
			continue;
		
		locDiv.innerHTML += `
			<div class="d-flex flex-column flex-md-row justify-content-between mb-5">
				<div class="flex-grow-1">
					<h3 class="mb-0">`+locConts[1].conts[i].job+`</h3>
					<div class="subheading mb-3">`+locConts[1].conts[i].company+`</div>
				</div>
				<div class="flex-shrink-0"><span class="text-primary">`+locConts[1].conts[i].time+`</span></div>
            </div>
			`;
	}	
		}
		{
			locDiv = document.getElementById('cert');
	for (var i = 0; i < locConts[2].conts.length; i++) {
		if (locConts[2].conts.length < i)
			continue;
		
		locDiv.innerHTML += `
			<div class="d-flex flex-column flex-md-row justify-content-between mb-5">
                        <div class="flex-grow-1">
                            <h3 class="mb-0">`+locConts[2].conts[i].name+`</h3>
                            <div class="subheading mb-3">`+locConts[2].conts[i].extra+`</div>
                        </div>
                        <div class="flex-shrink-0"><span class="text-primary">`+locConts[2].conts[i].data+`</span></div>
            </div>
			`;
	}
		}
		{
			locDiv = document.getElementById('edu');
	for (var i = 0; i < locConts[3].conts.length; i++) {
		if (locConts[3].conts.length < i)
			continue;
		
		locDiv.innerHTML += `
			<div class="d-flex flex-column flex-md-row justify-content-between mb-5">
                        <div class="flex-grow-1">
                            <h3 class="mb-0">`+locConts[3].conts[i].school+`</h3>
                            <div class="subheading mb-3">`+locConts[3].conts[i].type+`</div>
                            <div>`+locConts[3].conts[i].degree+`</div>
                            <p>`+locConts[3].conts[i].extra+`</p>
                        </div>
                        <div class="flex-shrink-0"><span class="text-primary">`+locConts[3].conts[i].time+`</span></div>
                    </div>
			`;
	}
		}
	
    
}

export function getUrlParameter(name) {
  // Get the query string part of the current URL
  const queryString = window.location.search;

  // Create a URLSearchParams object from the query string
  const params = new URLSearchParams(queryString);

  // Return the value of the specified parameter
  return params.get(name);
}
