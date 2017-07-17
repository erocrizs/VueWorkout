let fs = require('fs');
fs.readFile('./exercises.json', (err, data)=> {
	
	if(err) {
		console.log("error in reading file");
		return;
	}

	let exercises = JSON.parse(data);
	let categories = {
		type: {},
		muscle: {},
		equipment: {},
		level: {}
	};
	let categoryCount = {
		type: 0,
		muscle: 0,
		equipment: 0,
		level: 0
	}

	console.log('listing categories...');
	let count = 1;

	for(let code in exercises) {
		if( code === 'size' ) continue;
		console.log( '\t' + count + ') ' + code );
		count++;
		
		for(let categoryName in categories) {
			let category = categories[categoryName];
			if( exercises[code] && 
				exercises[code][categoryName] && 
				!category[ exercises[code][categoryName] ] ) {
				category[ exercises[code][categoryName] ] = true;
				categoryCount[ categoryName ]++;
			}
		}
	}

	console.log('writing file...')
	fs.writeFile('./categories.json', JSON.stringify( categories ), ()=>{
		console.log('FINISHED!')
		console.log('\tprocessed ' + (count-1) + exercises);
		console.log('\t' + categoryCount['type'] + ' workout types');
		console.log('\t' + categoryCount['muscle'] + ' muscle foci');
		console.log('\t' + categoryCount['equipment'] + ' equipments');
		console.log('\t' + categoryCount['level'] + ' levels');
	} );

});