import data from "../data/works.json" with { type: "json" };
			
export function Works(page) {
	page *= 4;
    var wkDiv = document.getElementById('workscreen');
    wkDiv.innerHTML = '';
	for (var i = page; i < page+4; i++) {
		
		if ((i%2)==0) {
			wkDiv.innerHTML += `<div class="d-flex flex-column flex-md-row justify-content-between">`;
		}
		if (data.length < i)
			continue;
		
		wkDiv.innerHTML += `
			<div class="flex-grow-1 m-1 p-1 border-bottom workItem" id="`+data[i]+`">
			<img class="showcase-image" src="img/showcase/`+(data[i].img === "" ? "none.png" : data[i].img)+`" />
            <h3 class="mb-0">`+data[i].title+`</h3>
            <div class="subheading mb-3">`+data[i].platform+`</div>
            <p>`+data[i].description+`</p>
			`+(data[i].url != "" ? `<a class="btn btn-primary text-white" target=blank href="https://www.youtube.com/watch?v=`+data[i].url+`" role="button">YouTube</a><?php }?>` : ``)+`
			<a class="btn btn-primary text-white" target=blank href="`+data[i].git+`" role="button">Github</a>
			<a class="btn btn-primary text-white" target=blank href="`+data[i].about+`" role="button">Play</a>
			</div>
			`;
		
		if ((i%2)==1) {
			wkDiv.innerHTML += `</div>`;
		}
	}
}

export function AllWorks() {
    var wkDiv = document.getElementById('workscreen');
    wkDiv.innerHTML = '';
	for (var i = 0; i < data.length; i++) {
		
		if ((i%2)==0) {
			wkDiv.innerHTML += `<div class="d-flex flex-column flex-md-row justify-content-between">`;
		}
		if (data.length < i)
			continue;
		
		wkDiv.innerHTML += `
			<div class="flex-grow-1 m-1 p-1 border-bottom workItem" id="`+data[i]+`">
			<img class="showcase-image" src="img/showcase/`+(data[i].img === "" ? "none.png" : data[i].img)+`" />
            <h3 class="mb-0">`+data[i].title+`</h3>
            <div class="subheading mb-3">`+data[i].platform+`</div>
            <p>`+data[i].description+`</p>
			`+(data[i].url != "" ? `<a class="btn btn-primary text-white" target=blank href="https://www.youtube.com/watch?v=`+data[i].url+`" role="button">YouTube</a><?php }?>` : ``)+`
			<a class="btn btn-primary text-white" target=blank href="`+data[i].git+`" role="button">Github</a>
			<a class="btn btn-primary text-white" target=blank href="`+data[i].about+`" role="button">Play</a>
			</div>
			`;
		
		if ((i%2)==1) {
			wkDiv.innerHTML += `</div>`;
		}
	}
}

