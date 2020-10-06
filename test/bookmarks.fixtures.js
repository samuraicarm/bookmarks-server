function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Amazon',
            url: 'http://www.amazon.com',
            description: 'Shopping',
            rating: 4
        },
        {
            id: 2,
            title: 'Google',
            url: 'http://www.google.com',
            description: 'Search',
            rating: 4
        },
        {
            id: 3,
            title: 'YouTube',
            url: 'http://www.youtube.com',
            description: 'Videos',
            rating: 4
        },
        {
            id: 4,
            title: 'Playstation',
            url: 'http://www.playstation.com',
            description: 'Video Games',
            rating: 4
        },
    ];
}

module.exports = {
    makeArticlesArray,
}