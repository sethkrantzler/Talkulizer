import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { blue } from '@material-ui/core/colors';
import { Dialog, DialogTitle, List, ListItem, ListItemAvatar, Avatar, ListItemText, DialogContentText } from '@material-ui/core';

const useStyles = makeStyles({
    avatar: {
        backgroundColor: blue[100],
        color: blue[600],
    },
});


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
];  

export default function HelpDialog(props: any) {
const classes = useStyles();
const { close, open } = props;


return (
        <Dialog onClose={close} aria-labelledby="simple-dialog-title" open={open}>
            <DialogTitle id="simple-dialog-title">Welcome to the Talkulizer!</DialogTitle>
            <DialogContentText id="simple-dialog-title">I made this audio visualizer to be fully customizable, there's over 20 different visualiztion types, with multiple parameters to change each one. I've provided over 75 presets from my testing that look cool, but play around and find what you think looks cool! Here are some handy commands that I've made to help make using the visualizer easier.
            </DialogContentText>
            <List>
                {shortcuts.map((shortcut) => (
                <ListItem key={shortcut.key}>
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
    open: PropTypes.bool.isRequired
};