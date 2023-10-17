const SERVER_URL =
	'https://script.google.com/macros/s/AKfycbypVGcHZ7mBtbTx6a2C6gDww9jSgvKL4i497L4R9vWu4mvJ0LNG06cnEowLRWhlbQGb/exec';
const USER_ID = 'bens_test_id';

function waitingForLoad() {
	let numPosts = document.getElementsByClassName('edge-item').length;
	if (numPosts < 1) {
		setTimeout(waitingForLoad, 500);
		return;
	}
	modifyPage();

	let query = [];
	let ids = document.getElementsByClassName('like-btn');
	for (let i = 0; i < ids.length; ++i) {
		if (!ids[i].classList.contains('dislike-button'))
			query.push(ids[i].getAttribute('ajax').substring(8));
	}

	let request = new XMLHttpRequest();
	request.open(
		'GET',
		SERVER_URL + '?mode=get&posts=' + JSON.stringify(query) + '&user=' + USER_ID
	);
	request.send();
	request.onload = () => {
		updateValues(JSON.parse(request.responseText).output);
	};
}

function modifyPage() {
	let posts = document.getElementsByClassName('edge-item');

	for (let i = 0; i < posts.length; ++i) {
		posts[i]
			.getElementsByClassName('edge-footer')[0]
			.children[2].insertAdjacentText('afterend', ' · ');
		let newDislikeButton = posts[i]
			.getElementsByClassName('edge-footer')[0]
			.children[3].insertAdjacentElement(
				'beforebegin',
				posts[i].getElementsByClassName('edge-footer')[0].children[2].cloneNode(true)
			);
		newDislikeButton.children[0].textContent = 'Dislike';
		newDislikeButton.classList.add('dislike-button');
		newDislikeButton.children[0].style.color = 'red';
		if (posts[i].getElementsByClassName('s-like-sentence').length > 0) {
			let newDislike = posts[i]
				.getElementsByClassName('s-like-sentence')[0]
				.insertAdjacentElement(
					'afterend',
					posts[i].getElementsByClassName('s-like-sentence')[0].cloneNode(true)
				);
			newDislike.className = 's-dislike-sentence';
			newDislike.classList.add('dislike-counter');
			newDislike.children[0].style.background =
				'url(' +
				chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
				') no-repeat -1px -76px';
			newDislike.children[1].remove();
			newDislike.lastChild.textContent = '__ people disliked this';
		} else {
			posts[i]
				.getElementsByClassName('feed-comments')[0]
				.classList.remove('s-update-edge-hide-comments-form');
			let newDislike = posts[i]
				.getElementsByClassName('feed-comments-top')[0]
				.insertAdjacentHTML(
					'afterend',
					'<span class="s-dislike-sentence dislike-counter"><span style="background: url(' +
						chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
						') -1px -76px no-repeat;"></span>__ people disliked this</span>'
				);
		}
	}

	let comments = document.getElementsByClassName('comment-footer');
	for (let i = 0; i < comments.length; ++i) {
		comments[i].insertBefore(document.createTextNode(' · '), comments[i].lastChild);
		let newDislikeButton = comments[i].insertBefore(
			comments[i].children[1].cloneNode(true),
			comments[i].lastChild
		);
		newDislikeButton.removeAttribute('ajax');
		newDislikeButton.classList.add('dislike-button');
		newDislikeButton.textContent = 'Dislike';
		newDislikeButton.style.setProperty('color', 'red', 'important');

		let newDislikeCounter = comments[i].lastElementChild.insertAdjacentHTML(
			'afterend',
			'<span class="infotip sCommonInfotip-processed s-dislike-comment" tipsygravity="s" tabindex="0" original-title=""><a class="like-details-btn schoology-processed sExtlink-processed" style="background: url(' +
				chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
				') 0px -77px no-repeat;"><span class="s-like-comment-icon dislike-counter">__</span></a><span class="infotip-content">__ people like this</span></span>'
		);
		// newDislikeCounter.getElementsByClassName('s-like-comment-icon')[0].innerText =
		// 	output[i + posts.length].dislikes;
		// newDislikeCounter.getElementsByClassName('s-like-comment-icon')[0].style.color = 'red';
	}
}

function updateValues(dislikes) {
	let counters = document.getElementsByClassName('dislike-counter');
	let id;
	for (let i = 0; i < counters.length; ++i) {
		if (counters[i].classList.contains('s-dislike-sentence'))
			id = counters[i].parentElement.parentElement
				.getElementsByClassName('like-btn')[0]
				.getAttribute('ajax')
				.substring(8);
		else
			id = counters[i].parentElement.parentElement.parentElement
				.getElementsByClassName('like-btn')[0]
				.getAttribute('ajax')
				.substring(8);
		for (let j = 0; j < dislikes.length; ++j) {
			if (dislikes[j].postId == id) {
				if (counters[i].classList.contains('s-dislike-sentence')) {
					if (dislikes[j].dislikes > 0) {
						counters[i].style.display = 'block';
						if (dislikes[j].dislikes == 1 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = 'You dislike this';
						else if (dislikes[j].dislikes == 1 && !dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = '1 person dislikes this';
						else if (dislikes[j].dislikes == 2 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = 'Disliked by you and 1 person';
						else if (dislikes[j].dislikes > 2 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent =
								'Disliked by you and ' + (dislikes[j].dislikes - 1) + ' people';
						else
							counters[i].lastChild.textContent =
								dislikes[j].dislikes + ' people disliked this';
					} else counters[i].style.display = 'none';
				} else {
					if (dislikes[j].dislikes > 0) {
						counters[i].lastChild.textContent = dislikes[j].dislikes;
						counters[i].parentElement.parentElement.style.display = 'inline';
					} else counters[i].parentElement.parentElement.style.display = 'none';
				}
				break;
			}
		}
	}
}

waitingForLoad();
