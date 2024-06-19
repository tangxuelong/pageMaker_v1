(function(){var isIE678=eval('"\\v"=="v"');
document.write('<script src="' + isIE678 ? "{{jquery.js}}" : "{{zepto.js}}" + '"></' + 'script>');
isIE678 && document.write('<style>#_{_width:960px;max-width:960px;margin:auto}</style>');
})();
