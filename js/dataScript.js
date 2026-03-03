import enWorks from "../data/works.json" with { type: "json" };
import enConts from "../data/localEn.json" with { type: "json" };
import jpConts from "../data/localJp.json" with { type: "json" };
import enBlog from "../data/blogs.json" with { type: "json" };

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
			<div class="flex-grow-1 m-1 p-1 workItem">
			<a class="workItem" target=_blank href="./mdRenderer.html?mdurl=./data/worksMd/`+(jp ? data[i].aboutJp : data[i].aboutEn)+`.md" role="button">
			`+( data[i].bannerEn ? `<span class="showcase-banner">`+(jp ? data[i].bannerJp : data[i].bannerEn)+`</span>` : ``)+`
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
		
		var searchData = "";
		if(jp)
			searchData = data[i].title + data[i].bannerJp + data[i].platform;
		else
			searchData = data[i].title + data[i].bannerEn + data[i].platform;
		
		htmlContent += `
			<div class="flex-grow-1 m-1 p-1 workItem workList" id="`+searchData+`">
			<a class="workItem" target=_blank href="./mdRenderer.html?mdurl=./data/worksMd/`+(jp ? data[i].aboutJp : data[i].aboutEn)+`.md" role="button">
			`+( data[i].bannerEn ? `<span class="showcase-banner">`+(jp ? data[i].bannerJp : data[i].bannerEn)+`</span>` : ``)+`
			<img class="showcase-image" src="img/showcase/`+(data[i].img === "" ? "none.png" : data[i].img)+`" /></a>
            <h3 class="mb-0">`+data[i].title+`</h3>
            <div class="subheading mb-3">`+data[i].platform+`</div>
			</div>
			`;
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

export function Blogs(page, type) {
	var jp = false;
	jp = (type == "jp" ? true : false);
	var data = enBlog;
	
	page *= 4;
    var blgDiv = document.getElementById('blogscreen');
    blgDiv.innerHTML = '';
	let htmlContent = '';
	for (var i = page; i < page+4; i++) {
		
		if (i >= data.length)
			continue;
		
		htmlContent += `
			<div class="d-flex flex-column flex-md-row justify-content-between mb-5">
            <div class="flex-grow-1">
            <h3 class="mb-0">`+(jp ? data[i].titleJp : data[i].titleEn)+`</h3>
            <div class="subheading mb-3">`+(jp ? data[i].topicJp : data[i].topicEn)+`</div>
            <p>`+(jp ? data[i].descJp : data[i].descEn)+`</p>
			<a class="btn btn-primary text-white" id="blogBtn1" target=_blank href="./mdRenderer.html?mdurl=./data/blogsMd/`+(jp ? data[i].aboutJp : data[i].aboutEn)+`.md">READ</a>
            </div>
            <div class="flex-shrink-0"><span class="text-primary">`+data[i].date+`</span></div>
			
            </div>
			<hr>
			`;
	}
	blgDiv.innerHTML = htmlContent;
}

export function AllBlogs(type) {
	var jp = false;
	jp = (type == "jp" ? true : false);
	var data = enBlog;
	
    var blgDiv = document.getElementById('blogscreen');
    blgDiv.innerHTML = '';
	let htmlContent = '';
	for (var i = 0; i < data.length; i++) {
		
		if (i >= data.length)
			continue;
		
		var searchData = "";
		if(jp)
			searchData = data[i].titleJp + data[i].topicJp + data[i].descJp;
		else
			searchData = data[i].titleEn + data[i].topicEn + data[i].descEn;
		
		htmlContent += `
			<div class="mb-5 blogList" id="`+searchData+`">
            <div class="flex-grow-1">
            <h3 class="mb-0">`+(jp ? data[i].titleJp : data[i].titleEn)+`</h3>
            <div class="subheading mb-3">`+(jp ? data[i].topicJp : data[i].topicEn)+`</div>
            <p>`+(jp ? data[i].descJp : data[i].descEn)+`</p>
			<div><span class="text-primary">`+data[i].date+`</span></div>
			<a class="btn btn-primary text-white" id="blogBtn1" target=_blank href="./mdRenderer.html?mdurl=./data/blogsMd/`+(jp ? data[i].aboutJp : data[i].aboutEn)+`.md">READ</a>
            </div>
			<hr>
            </div>
			`;
	}
	
	blgDiv.innerHTML = htmlContent;
}