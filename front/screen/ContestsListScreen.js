import React, {useContext, useEffect, useRef, useState} from "react"
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator, TouchableOpacity, Modal
} from "react-native"
import MaterialCommunityIcon from "react-native-paper/src/components/MaterialCommunityIcon"
import RBSheet from "react-native-raw-bottom-sheet"
import {ContestsListFilters} from "./ContestsListFilters"
import {ContestListItem} from "../component/ContestListItem"
import AuthContext from "../context/AuthContext"
import {getContests} from "../service/APIService"
import authContext from "../context/AuthContext";
import {AnonymousModal} from "../component/AnonymousModal";

export const ContestsListScreen = ({navigation}) => {
    const {token, setToken, user, setUser} = useContext(authContext)
    const refRBSheet = useRef()
    const [type, setType] = useState('coming')
    const [contests, setContests] = useState([])
    const [page, setPage] = useState(1)
    const [firstLoading, setFirstLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)

    useEffect(() => {
        saveContests().then(() => {
            setFirstLoading(false)
        })
    }, [])

    useEffect(() => {
        if (loading) {
            setPage(page + 1)
        }
    }, [loading])

    useEffect(() => {
        saveContests()
    }, [page])

    useEffect(() => {
        if (contests) {
            setLoading(false)
        }
    }, [contests])

    useEffect(() => {
        loadContests()
    }, [type])

    const restoreFirstLoading = async () => {
        setFirstLoading(true)
    }

    const loadContests = () => {
        restoreFirstLoading().then(() => {
            setContests([])
        }).then(() => {
            setPage(1)
        }).then(() => {
            saveContests().then(() => {
                setFirstLoading(false)
            })
        })
    }

    const saveContests = async () => {
        const request = await getContests(token, page, type)
        if (request.status === 200) {
            const response = await request.json()
            page === 1 ? setContests(response['hydra:member']) :
                setContests([...contests, ...response['hydra:member']])
        }
    }

    const renderItem = ({item}) => {
        return (
            <Pressable onPress={() => {
                user ?
                navigation.navigate('Contest', {contest: item}) : setModalVisible(true)
            }}>
                <ContestListItem item={item} key={item.id} type={type} />
            </Pressable>
        )
    }

    const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - 1
    }

    return (
        <SafeAreaView style={styles.container}>
            <AnonymousModal modalVisible={modalVisible} setModalVisible={setModalVisible}/>
            {firstLoading ?
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size={80} color={'#00A1E7'}/>
                </View> :
                <View style={{flex: 1}}>
                    <View style={styles.content}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 15
                        }}>
                            <View style={{flexDirection: 'row'}}>
                                <Pressable style={type === 'inprogress' ? styles.activeFilter : styles.filter}
                                           onPress={() => {
                                               user ? setType('inprogress') : setModalVisible(true)
                                           }}>
                                    <Text style={type === 'inprogress' ? styles.activeFilterText : styles.filterText}>En
                                        cours</Text>
                                </Pressable>

                                <Pressable style={type === 'coming' ? styles.activeFilter : styles.filter}
                                           onPress={() => {
                                               user ? setType('coming') : setModalVisible(true)
                                           }}>
                                    <Text style={type === 'coming' ? styles.activeFilterText : styles.filterText}>A
                                        venir</Text>
                                </Pressable>

                                <Pressable style={type === 'done' ? styles.activeFilter : styles.filter}
                                           onPress={() => {
                                               user ? setType('done') : setModalVisible(true)
                                           }}>
                                    <Text
                                        style={type === 'done' ? styles.activeFilterText : styles.filterText}>Terminés</Text>
                                </Pressable>
                            </View>
                            <Pressable onPress={() => user ? refRBSheet.current.open() : setModalVisible(true)}>
                                <MaterialCommunityIcon name="tune" color="#00A1E7" size={26} direction={"ltr"}/>
                            </Pressable>
                        </View>
                    </View>
                    <FlatList
                        style={{marginHorizontal: 20}}
                        showsVerticalScrollIndicator={false}
                        data={contests}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        onScroll={({nativeEvent}) => {
                            if (isCloseToBottom(nativeEvent)) {
                                setLoading(true)
                            }
                        }}
                    />
                    <RBSheet
                        ref={refRBSheet}
                        closeOnDragDown={true}
                        closeOnPressMask={true}
                        customStyles={{
                            wrapper: {
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                            },
                            container: {},
                            draggableIcon: {
                                backgroundColor: "#000"
                            }
                        }}

                    >
                        <ContestsListFilters/>
                    </RBSheet>
                    {
                        loading &&
                        <View style={styles.loaderBlock}>
                            <ActivityIndicator size={'large'} color={'#00A1E7'}/>
                        </View>
                    }
                    {user?.roles?.includes('ROLE_PRO') &&
                        <TouchableOpacity
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 60,
                                position: 'absolute',
                                bottom: 20,
                                right: 20,
                                height: 60,
                                backgroundColor: '#00A1E7',
                                borderRadius: 100,
                            }}

                            onPress={() => {
                                navigation.navigate('ContestCreation')
                            }}
                        >
                            <MaterialCommunityIcon name='plus' size={30} color='#fff'/>
                        </TouchableOpacity>
                    }
                </View>
            }
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        paddingBottom: 10,
        paddingTop: 40,
        marginHorizontal: 20
    },
    filter: {
        borderWidth: 1,
        borderColor: '#00A1E7',
        padding: 8,
        paddingHorizontal: 15,
        borderRadius: 50,
        marginRight: 10
    },
    activeFilter: {
        backgroundColor: '#00A1E7',
        padding: 8,
        paddingHorizontal: 15,
        borderRadius: 50,
        marginRight: 10
    },
    filterText: {
        color: '#00A1E7',
        fontWeight: 'bold'
    },
    activeFilterText: {
        color: '#ffffff',
        fontWeight: 'bold'
    },
    loaderBlock: {
        position: 'absolute',
        width: '100%',
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
})

