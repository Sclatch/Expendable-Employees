import React, {useEffect, useState} from 'react';
import {fade, makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import {ViewState} from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    WeekView,
    Toolbar,
    DateNavigator,
    Appointments,
    TodayButton,
    AppointmentTooltip
} from '@devexpress/dx-react-scheduler-material-ui';
import {Box} from "@material-ui/core";
import axios from "axios";
import {getUserToken} from "../utils/userSession";

/*
//Hardcoded test data
const schedulerData = [
    {startDate: '2021-04-12T08:00', endDate: '2021-04-12T12:00', title: 'Shift'},
    {startDate: '2021-04-13T10:00', endDate: '2021-04-13T14:00', title: 'Shift'},
    {startDate: '2021-04-15T09:45', endDate: '2021-04-15T12:00', title: 'Shift'},
    {startDate: '2021-04-17T08:00', endDate: '2021-04-17T20:00', title: 'Shift'},
    {startDate: '2021-04-18T08:00', endDate: '2021-04-18T12:00', title: 'Shift'},
    {startDate: '2021-04-19T10:00', endDate: '2021-04-19T14:00', title: 'Shift'},
    {startDate: '2021-04-21T09:45', endDate: '2021-04-21T12:00', title: 'Shift'},
    {startDate: '2021-04-22T08:00', endDate: '2021-04-22T20:00', title: 'Shift'},
];
*/

const useStyles = makeStyles((theme) => ({
    //Current day colour styling:
    todayCell: {
        backgroundColor: fade(theme.palette.primary.light, 0.05),
        '&:hover': {
            backgroundColor: fade(theme.palette.primary.light, 0.07),
        },
        '&:focus': {
            backgroundColor: fade(theme.palette.primary.light, 0.09),
        },
    },
    today: {
        backgroundColor: fade(theme.palette.primary.light, 0.05),
    },
}));

// Highlights current day cells/rows
const TimeTableCell = (props) => {
    const classes = useStyles();
    const {startDate} = props;
    const date = new Date(startDate);

    if (date.getDate() === new Date().getDate()) {
        return <WeekView.TimeTableCell {...props} className={classes.todayCell}/>;
    }
    return <WeekView.TimeTableCell {...props} />;
};

// Highlights current day header
const DayScaleCell = (props) => {
    const classes = useStyles();
    const today = props;

    if (today) {
        return <WeekView.DayScaleCell {...props} className={classes.today}/>;
    }
    return <WeekView.DayScaleCell {...props} />;
};

export default function Schedule() {

    const currentDate = new Date();

    let token = getUserToken();

    const [state, setState] = useState({
        "schedulerData": []
    });


    useEffect(() => {

        async function getData() {
            if (token == null) {

            } else {

                axios({
                    method: "get",
                    url: "http://localhost:3001/api/schedule/user",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                }).then((response) => {
                    console.log(response.data);
                    setState({"schedulerData": response.data});
                    return response.data[0];
                }).catch(error => {
                    console.log(error);
                });
            }
        }

        getData();
    }, [token]);

    return (
        <Box>
            <Paper>
                <Scheduler
                    data={state.schedulerData}
                    height='auto'
                >
                    <ViewState
                        defaultCurrentDate={currentDate}
                    />
                    <WeekView
                        startDayHour={0}
                        endDayHour={24}
                        timeTableCellComponent={TimeTableCell}
                        dayScaleCellComponent={DayScaleCell}
                    />
                    <Toolbar/>
                    <DateNavigator/>
                    <TodayButton/>
                    <Appointments/>
                    <AppointmentTooltip/>
                </Scheduler>
            </Paper>
        </Box>
    );
}