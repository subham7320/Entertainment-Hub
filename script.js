const apiKey = '4ed570cf060183327281982c0aca7d5d'; // Replace with your actual TMDB API key
const baseUrl = 'https://api.themoviedb.org/3';
const imageBaseUrl = 'https://image.tmdb.org/t/p/w200';
const backdropBaseUrl = 'https://image.tmdb.org/t/p/original';
let currentPage = 1;
let currentGenre = '';
let currentSearch = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" }
];

document.addEventListener('DOMContentLoaded', () => {
    setupGenreDropdown();
    setupEventListeners();
    loadInitialContent();
});

function setupGenreDropdown() {
    const genreSelect = document.getElementById('genreSelect');
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
    });
}

function getSelectedGenres() {
    const genreSelect = document.getElementById('genreSelect');
    return Array.from(genreSelect.selectedOptions).map(option => option.value);
}

function setupEventListeners() {
    document.getElementById('darkModeToggle').addEventListener('click', (e) => {
        document.body.classList.toggle('dark-mode');
        createRipple(e);
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        if (e.target.value === '') {
            showAllSections();
        }
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('movieModal').style.display = "none";
    });

    window.onclick = (event) => {
        if (event.target == document.getElementById('movieModal')) {
            document.getElementById('movieModal').style.display = "none";
        }
    };

    document.querySelector('.sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });

    document.getElementById('minRating').addEventListener('input', (e) => {
        document.getElementById('ratingValue').textContent = e.target.value;
        searchMovies();
    });

    document.getElementById('randomMovie').addEventListener('click', showRandomMovie);

    document.getElementById('sortBy').addEventListener('change', () => searchMovies());

    document.getElementById('genreSelect').addEventListener('change', () => {
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length === 0) {
            showAllSections();
        } else {
            searchMovies();
        }
    });
}

function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];

    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

async function loadInitialContent() {
    await loadPopularMovies();
    await loadLatestMovies();
    await loadTrendingMovies();
    setRandomBackdrop();
    setupInfiniteScroll();
    setupBackToTopButton();
}

async function loadLatestMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#latestMovies .movie-row'));
}

async function loadPopularMovies() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    displayMovies(movies, document.querySelector('#popularMovies .movie-row'));
}

async function loadTrendingMovies() {
    const movies = await fetchMovies(`${baseUrl}/trending/movie/week?api_key=${apiKey}`);
    displayMovies(movies, document.querySelector('#trendingMovies .movie-row'));
}

async function setRandomBackdrop() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const heroElement = document.getElementById('hero');
    heroElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backdropBaseUrl}${randomMovie.backdrop_path})`;
}

async function fetchMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

function displayMovies(movies, container) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        container.appendChild(movieElement);
    });
    updateFavoriteButtons();
}

function createMovieElement(movie) {
    const movieElement = document.createElement("div");
    movieElement.className = "movie";
    movieElement.innerHTML = `
        <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}" loading="lazy">
        <h3>${movie.title}</h3>
        <p>Rating: ${movie.vote_average}/10</p>
        <button class="favorite-btn" data-movie-id="${movie.id}">🤍</button>
    `;
    movieElement.addEventListener('click', () => showMovieDetails(movie.id));
    movieElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie.id);
    });
    return movieElement;
}

function showAllSections() {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('latestMovies').style.display = 'block';
    document.getElementById('popularMovies').style.display = 'block';
    document.getElementById('trendingMovies').style.display = 'block';
}


function toggleFavorite(movieId) {
    const index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const movieId = btn.dataset.movieId;
        btn.textContent = favorites.includes(parseInt(movieId)) ? '❤️' : '🤍';
    });
}

async function searchMovies(append = false) {
    const searchInput = document.getElementById("searchInput");
    currentSearch = searchInput.value;
    const movieList = document.getElementById("movieList");
    const searchResults = document.getElementById("searchResults");
    const minRating = document.getElementById('minRating').value;
    const sortBy = document.getElementById('sortBy').value;

    if (!append) {
        movieList.innerHTML = "<p>Loading...</p>";
        currentPage = 1;
    }

    try {
        let url;
        const selectedGenres = getSelectedGenres();
        
        if (currentSearch) {
            url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${currentSearch}&page=${currentPage}`;
        } else if (selectedGenres.length > 0) {
            url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${selectedGenres.join(',')}&sort_by=${sortBy}&page=${currentPage}`;
        } else {
            url = `${baseUrl}/discover/movie?api_key=${apiKey}&sort_by=${sortBy}&page=${currentPage}`;
        }

        const movies = await fetchMovies(url);
        
        if (!append) movieList.innerHTML = "";

        const filteredMovies = movies.filter(movie => movie.vote_average >= minRating);

        filteredMovies.forEach(movie => {
            const movieElement = createMovieElement(movie);
            movieList.appendChild(movieElement);
        });

        searchResults.style.display = "block";
        updateFavoriteButtons();

        // Hide other sections when showing search results
        document.getElementById('latestMovies').style.display = 'none';
        document.getElementById('popularMovies').style.display = 'none';
        document.getElementById('trendingMovies').style.display = 'none';
    } catch (error) {
        movieList.innerHTML = "<p>Error fetching movies. Please try again.</p>";
        console.error('Error:', error);
    }
}


async function showMovieDetails(movieId) {
    const modal = document.getElementById('movieModal');
    const modalContent = document.getElementById('movieDetails');
    modalContent.innerHTML = "Loading...";
    modal.style.display = "block";

    try {
        const response = await fetch(`${baseUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,similar`);
        const movie = await response.json();

        const cast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
        const similarMovies = movie.similar.results.slice(0, 5).map(m => m.title).join(', ');

        modalContent.innerHTML = `
            <h2>${movie.title}</h2>
            <img src="${imageBaseUrl}${movie.poster_path}" alt="${movie.title}">
            <p>${movie.overview}</p>
            <p>Release Date: ${movie.release_date}</p>
            <p>Rating: ${movie.vote_average}/10</p>
            <p>Runtime: ${movie.runtime} minutes</p>
            <p>Budget: $${movie.budget.toLocaleString()}</p>
            <p>Genres: ${movie.genres.map(g => g.name).join(', ')}</p>
            <p>Main Cast: ${cast}</p>
            <p>Similar Movies: ${similarMovies}</p>
        `;
    } catch (error) {
        modalContent.innerHTML = "Error loading movie details.";
        console.error('Error:', error);
    }
}

async function showRandomMovie() {
    const movies = await fetchMovies(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    showMovieDetails(randomMovie.id);
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreMovies();
        }
    }, { threshold: 1 });

    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.textContent = 'Loading...';
    document.getElementById('movieList').appendChild(loader);
    observer.observe(loader);
}

async function loadMoreMovies() {
    currentPage++;
    await searchMovies(true);
}

function setupBackToTopButton() {
    const backToTopButton = document.getElementById('backToTop');
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    };
    backToTopButton.onclick = function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    };
}

// Initial load
loadInitialContent();