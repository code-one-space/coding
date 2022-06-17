import {Text, View, SafeAreaView, ScrollView, BackHandler, Modal} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Button ,PersonButton, NotifyButton, SelectNotificationButton } from "@@components";
import * as HttpClient from "../../shared/httpClient/httpClient";
import { useEffect, useState } from "react";
import style from './mainscreen.style';
import * as HardwareBackButtonHandler from "../../shared/backButtonHandler/backButtonHandler";

export default function MainScreen ({ navigation, route }) {
    BackHandler.addEventListener('hardwareBackPress', HardwareBackButtonHandler.handleBackButton); // ConfirmScreen needs to be called on leave

    const [members, setMembers]  = useState([
        { id: "0", name: route.params.memberName } // request takes long time -> show own name before success
    ]);

    const [sixHatsButtonTitle, setSixHatsButtonTitle] = useState("Start Six Hats");
    let [tool, setTool] = useState("");

    const [selectNotificationVisible, setSelectNotificationVisible] = useState(false);
    const [notificationReceiver, setNotificationReceiver] = useState(undefined);

    useEffect(() => {
        let refreshAllData = () => {
            HttpClient.getMeetingInformation().then(data => {
                if (Object.keys(data ?? {}).length == 0)
                    return;
                setMembers([...data.members]);
                setTool(data.currentTool);
                setSixHatsButtonTitle(data.currentTool == "" ? "Start Six Hats" : "Stop Six Hats");

                let notifications = data?.members.filter(member => member?.id == HttpClient.memberId)[0].notifications;
                if (!!notifications) {
                    for (let notification of notifications) {
                        alert("Notification received: " + notification.message);
                        HttpClient.deleteNotification(notification.id);
                    }
                }
            }).catch(console.error);
        }

        refreshAllData();
        let interval = setInterval(() => refreshAllData(), 2000);
        return () => { 
            clearInterval(interval)
            setMembers([])
        };
    }, []);

    const handleOpenSendNotificationPopUp = (member) => {
        setNotificationReceiver(member);
        setSelectNotificationVisible(true);
    }

    const handleSendNotification = (message) => {
        HttpClient.createNotification(notificationReceiver.id, message);
        setSelectNotificationVisible(!selectNotificationVisible);
    }

    let memberButtons = members?.map(member => {
        if (member?.id === HttpClient.memberId || member?.id === "0")
            return <PersonButton key={ member?.id } title={ member?.name } color = { member?.hat }/>

        return (
            <View style={ style.personButton } key={ member?.id }>
                <PersonButton title={ member?.name } color = { member?.hat }/>
                <NotifyButton onPress={() => handleOpenSendNotificationPopUp(member)}/>
            </View>

        )})

    let handleStartStopTool = () => {
        if (tool == "") {
            HttpClient.startTool().then(data => {
                setTool(data.currentTool);
                setMembers([...data?.members]);
                setSixHatsButtonTitle("Stop Six Hats");
            }).catch(console.error)
        } else {
            HttpClient.quitTool().then(data => {
                setTool("");
                setMembers([...data?.members]);
                setSixHatsButtonTitle("Start Six Hats");
            }).catch(console.error);
        }
    }

    return (
        <SafeAreaView style={style.container}>
            <Modal
                transparent={true}
                visible={selectNotificationVisible}
                onRequestClose={() => setSelectNotificationVisible(!selectNotificationVisible)}>
                <View style={style.modalContainer}>
                    <View style={style.modalInnerContainer}>
                        <Text style={style.modalHeader}>{notificationReceiver?.name}</Text>
                        <View style={style.modalButtonContainer}>
                            <SelectNotificationButton title={"Come on, time's up!"} white={true} onPress={() => handleSendNotification("Come on, time's up!")}/>
                        </View>
                        <View style={style.modalButtonContainer}>
                            <SelectNotificationButton title={"Can I ask a question?"} white={true} onPress={() => handleSendNotification("Can I ask a question?")}/>
                        </View>
                        <View style={style.modalButtonContainer}>
                            <Button title={"Cancel"} onPress={() => setSelectNotificationVisible(!selectNotificationVisible)}/>
                        </View>
                    </View>
                </View>
            </Modal>
            <View>
                <StatusBar style="auto" />
            </View>
            <View style={style.list}>
                <ScrollView>
                    {memberButtons}
                </ScrollView>
            </View>
            <View style={style.start6HatsButton}>
                <Button title={sixHatsButtonTitle} spamProtection={true} onPress={() => handleStartStopTool()}/>
            </View>
        </SafeAreaView>
    )
}
