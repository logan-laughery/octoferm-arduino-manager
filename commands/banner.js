import chalk from 'chalk';
import figlet from 'figlet';

figlet(process.argv[2], (error, data) => {
    if (error) {
        return process.exit(1);
    }

    console.log(chalk.blue(data));
    console.log('');
    return process.exit(0);
});
