module.exports = {
    theme: {
        extend: {
            boxShadow: {
                card: "0 5px 10px 0 #363636",
                "card-correct": "0 0 2px 5px #00bf29",
                "card-incorrect": "0 0 2px 5px #d40000"
            },
            colors: {
                "log-success": "#00b105",
                "log-info": "#295372",
                "log-warn": "#aba200",
                "log-error": "#b70000",
            },
            fontFamily: {
                'fancy': ['FancyFont', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
            },
            margin: {
                "per-130": "-130%"
            },
            width: {
                "question": "24rem",
            },
            height: {
                "question": "36rem",
                "screen-152": "152vw",
            }
        }
    },
    variants: {},
    plugins: []
}
