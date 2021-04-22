import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { blue } from '@material-ui/core/colors';
import { Dialog, DialogTitle, List, ListItem, ListItemAvatar, Avatar, ListItemText, DialogContentText, Button } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    title: {
        textAlign: 'center',
        '& h2': {
            fontSize: '2.25em'
        }
    },
    containsText: {
        color: 'black',
        padding: '10px',
    },
    seperator: {
        border: "1px solid black",
        borderRadius: '75px',
        width: '80%'
    },
    shortcutItem:{
        paddingLeft: '20%',
    },
    shortcutHeaders:{
        paddingLeft: '20%',
        '& span': {
            fontWeight: 'bold'
        }
    },
    inputButton: {
        backgroundColor: blue[100],
        color: 'black',
        width: '33%',
        margin: '20px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center'
    }
}));


const shortcuts = [
    {
        key: "R",
        text: "Random Preset"
    },
    {
        key: "C",
        text: "Toggle automatic cycling"
    },
    {
        key: "Up",
        text: "Increase cycle period"
    },
    {
        key: "Down",
        text: "Decrease cycle period"
    },
    {
        key: "G",
        text: "Green Screen Background"
    },
    {
        key: "B",
        text: "Blue Screen Background"
    },
    {
        key: "H",
        text: "Random Background"
    },
    {
        key: "U",
        text: "Toggle UI"
    },
];  

export default function HelpDialog(props: any) {
    const classes = useStyles();
    const { close, open, setSpeakerAsInput, setMicAsInput } = props;

    const welcomeText = "Before we can start, you'll need to decide whether you want to use your computer's microphone or your speakers as the visualizer's input. (NOTE: If you select 'Speakers', a menu will pop up asking you to select your source. If on Windows, select any screen, and make sure the 'Share Audio' button in the bottom left is selected. On Mac, this option is only present from selecting a chrome tab, so any audio you want to visualize will need to come from that tab.)";

    const shortcutText = "I made this audio visualizer to be fully customizable, there's over 20 different visualiztion types, with multiple parameters to change each one. I've provided over 75 presets from my testing that look cool, but play around and find what you think looks cool! Here are some handy shortcuts that I've made to help make using the visualizer easier.";

    return (
        <Dialog onClose={close} open={open}>
            <DialogTitle className={classes.title}>Welcome to the Talkulizer!</DialogTitle>
            <DialogContentText className={classes.containsText}>{welcomeText}</DialogContentText>
            <div className={classes.buttonContainer}>
                <Button className={classes.inputButton} onClick={setSpeakerAsInput}>Speakers</Button>
                <Button className={classes.inputButton} onClick={setMicAsInput}>Mic</Button>
            </div>
            <hr className={classes.seperator}></hr>
            <DialogContentText className={classes.containsText}>{shortcutText}</DialogContentText>
            <List>
                <ListItem className={classes.shortcutHeaders} key={"headers"}>
                    <ListItemText primary={"Key"} />
                    <ListItemText primary={"Description"} />
                </ListItem>
                {shortcuts.map((shortcut) => (
                <ListItem className={classes.shortcutItem} key={shortcut.key}>
                    <ListItemText primary={shortcut.key} />
                    <ListItemText primary={shortcut.text} />
                </ListItem>
                ))}
            </List>
        </Dialog>
    );
}

HelpDialog.propTypes = {
    close: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    setSpeakerAsInput: PropTypes.func.isRequired,
    setMicAsInput: PropTypes.func.isRequired
};