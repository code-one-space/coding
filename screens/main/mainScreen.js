import {View, SafeAreaView, ScrollView, BackHandler} from "react-native";
import { StatusBar } from "expo-status-bar";
import { PersonButton, Button, ToolsListItem } from "@@components";
import * as HttpClient from "../../shared/httpClient/httpClient";
import {useEffect, useState} from "react";

import style from './mainscreen.style';
import * as HardwareBackButtonHandler from "../../shared/backButtonHandler/backButtonHandler";

export default function MainScreen ({ navigation, route }) {
    BackHandler.addEventListener('hardwareBackPress', HardwareBackButtonHandler.handleBackButton); // ConfirmScreen needs to be called on leave

    const [members, setMembers]  = useState([
        { id: "0", name: route.params.memberName } // request takes long time -> show own name before success
    ]);

    const [tools, setTools] = useState([]);

    useEffect(() => {
        let interval = setInterval(() => {
            HttpClient.getMeetingInformation().then(data => {
                if (Object.keys(data??{}).length == 0)
                    return;
                setMembers([...data.members]);
                setTools(data.tools);
            }).catch(console.error);
        }, 4000);
            return () => clearInterval(interval);
    }, []);

    let memberButtons = members?.map(member => {
        return (
            <PersonButton key={ member?.id } title={ member?.name } color = {"yellow"} /> // TODO replace color with given hat
        )})

    let toolButtons = tools?.map(tool => {
        return <ToolsListItem title={ tool.toolType } timestamp={ tool.createdAt } done={ tool.done } onPress={ () => HttpClient.quitTool(tool.id) }/>;
    });

    function handleStartTool() {
        HttpClient.startTool("devils_advocat", members).then(data => {
            setTools(data.tools); // TODO sometimes this triggers "undefined is not an object" on first try
            console.log(data);
        }).catch(console.error);
    }

    return (
        <SafeAreaView style={style.container}>
            <View>
                <StatusBar style="auto" />
            </View>
            <View style={style.list}>
                <ScrollView>
                    {memberButtons}
                </ScrollView>
            </View>
            <Button title={"Add Tool"} onPress={() => handleStartTool()}/>
            <View style={style.list}>
                <ScrollView>
                    {toolButtons}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}
