import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, CheckBox, TextInput, Pressable, Image } from 'react-native'

const timer = ms => new Promise(res => setTimeout(res, ms))
const serverURL = 'http://127.0.0.1:80/chat';

export default function ChatGPT() {
    const [data, setData] = useState([]);
    const [textInput, setTextInput] = useState("");
    const [isProgressIconVisible, setProgressIconVisibility] = useState(false);
    const [height, setHeight] = useState(80);
    const [textOutput, setTextOutput] = useState("");
    const [showContext, setShowContext] = useState(false);

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [promptHeight, setPromptHeight] = useState(80);
    const [promptSectionHeight, setPromptSectionHeight] = useState(100);
    const [topSectionHeight, setTopSectionHeight] = useState(20);

    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener when the component unmounts
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const toggleProgressIconVisibility = () => {
        setProgressIconVisibility(!isProgressIconVisible);
    };
    const hideProgressIcon = () => {
        setProgressIconVisibility(false);
    }

    const list = useRef(null);

    const clearInput = () => {
        setTextInput("");
        setHeight(80);
    };
    const clearAll = () => {
        clearInput();
        setData([]);
        hideProgressIcon();
        setTextOutput("");
    };

    const seperator = () => {
        return (
            <View style={styles.seperator} />
        )
    };

      
      

    async function readAndDisplayResponse(response) {
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
        let first20 = "";
        let text = "";
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                } else {
                    let chunk = value;
                    first20 = "";
                    while (true) {
                        if (chunk.length > 20) {
                            // noen chunk kan være store, behov for å stykke de opp
                            first20 = chunk.slice(0, 20);
                            text += first20;
                       
                            setData([...data, { type: 'user', buttonText: "USER", 'text': textInput },
                            { type: 'bot', buttonText: "ASSISTENT", 'text': text }]);
                    
                            chunk = chunk.slice(20);
                            await timer(1);
                        } else {
                            text += chunk;
                            
                            setData([...data, { type: 'user', buttonText: "USER", 'text': textInput },
                            { type: 'bot', buttonText: "ASSISTENT", 'text': text }]);
                        
                            break;
                        }
                        list.current.scrollToEnd({ animated: true })
                    }
                    
                }
            
            }
            
        } catch (error) {
            // Handle any errors that occur during reading
            console.error("Error reading the stream:", error);
        } finally {
            // Close the reader when you're done with it to release resources
            reader.releaseLock();
        }

        return text;
    }

    const handleSend = async () => {

        try {

            let completeRespText = "";

            const response = await fetch(serverURL, {
                method: 'POST',
                headers: {
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [{
                        role: "system",
                        content: "You are a helpful assistant, you will be provided with a user query. Your task is to answer the query in norwegian and in a detailed and comprehensive way, using only the provided context information. If you find the answer, use at least 100 words to answer. " +
                            "If you don't find the answer in the provided context, answer in norwegian:\"Beklager, jeg fant ikke svaret i referansetekstene!\""
                    }, {
                        role: "user",
                        content: textInput
                    }],
                    showContext: showContext,
                }),
            });
            clearInput();

            // update only userinput
            setData([...data, { type: 'user', buttonText: "USER", 'text': textInput },
            { type: 'bot', buttonText: "ASSISTENT", 'text': completeRespText }]);
            console.log("resp:", response);


            await readAndDisplayResponse(response);

            hideProgressIcon();

        } catch (error) {
            console.log("error", error);
            hideProgressIcon();
        }
    }


    return (

        <View style={styles.container}>
            <View 
                onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    if (topSectionHeight !== layout.height) {
                        setTopSectionHeight(layout.height); // assuming you want to store the entire layout 
                    }
                }}
                style={[styles.row, { minHeight: 100, flexDirection: 'row' }]}>
                <View style={[styles.col1, { flex: 2, }]}>
                </View>

                <View style={[styles.col2, { flex: 8, justifyContent: 'left',} ]}>
                    <Text style={[styles.title, { textAlign: 'left' }]}>Test av VectorIndex for OpenAI</Text>
                    <Text style={[styles.ingress, { textAlign: 'left' },]}>Denne assistenten bruker ChatGPT til å foreslå et svar basert på referansetekster.</Text>
                    <Text style={[styles.ingress, { textAlign: 'left' },]}>Referansetekstene kan være et utvalg av txt, docx, pdf-filer eller nettsider</Text>
                    <Text style={[styles.ingress, { textAlign: 'left' },]}>I denne prototypen er det lest inn en pdf-fil fra wikipedia om Titanic</Text>
                    <Text style={[styles.ingress, { textAlign: 'left' },]}>Du kan starte med å sprørre: "Når forliste Titanic?", "Hvilke skader fikk skipet?"</Text>

                    <View style={[styles.row, { paddingTop: 8, justifyContent: 'flex-start' }]}>
                        <Text style={[styles.subtitle, { textAlign: 'left', paddingRight: 20 }]}>Vis referansetekster som er brukt:</Text>
                        <CheckBox
                            value={showContext}
                            onValueChange={(newValue) => {
                                setShowContext(newValue);
                            }}
                            style={styles.checkbox}
                            color='grey'
                        />
                    </View>
                </View>
                <View style={[styles.col1, { flex: 2, minHeight: 100 }]}>
                </View>
            </View>

            <View style={[styles.row, { height: windowHeight - topSectionHeight - promptSectionHeight, }]}>
                <View style={[styles.col1, { flex: 2 }]}>
                </View>
                <View style={[styles.col2, { minHeight: 300, maxHeight: 900, flex: 8 }]}>

                    <FlatList
                        ref={list}
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        ItemSeparatorComponent={seperator}
                        ListFooterComponent={<View style={{ height: 20 }} />}
                        style={[styles.body, { borderRadius: 4 }]}

                        //onContentSizeChange={() => list.current.scrollToEnd({ animated: true })}
                        //inverted={-1}
                        renderItem={({ item, index }) => (
                            <View style={[{ flexDirection: 'row', padding: 2, /* backgroundColor: getBackgroundColor(item)*/ }]}>
                                <Text style={styles.role}>{item.buttonText} </Text><Text style={styles.bot}>{item.text}</Text>
                            </View>
                        )}
                    />

                </View>
                <View style={[styles.col1, { flex: 2 }]}>
                </View>
            </View>

            <View style={[styles.row, { minHeight: 100, }]}>
                <View style={[styles.col1, { flex: 2 }]}>
                </View>
                <View style={[styles.col2, { flex: 8 }]}>
                    <TextInput
                        style={[styles.input, { height: Math.max(80, promptHeight) }]}
                        placeholder="Angi spørsmålet her.."
                        spellCheck="false"
                        readOnly={false}
                        multiline
                        rows={5}
                        maxLength={1000}
                        value={textInput}
                        onContentSizeChange={(e) => {
                            const newHeight = e.nativeEvent.contentSize.height;
                            setPromptHeight(newHeight);
                        }}
                        onChangeText={text => setTextInput(text)}

                    />
                </View>
                <View style={[styles.col1, { flex: 2 }]}>
                    {!isProgressIconVisible && (
                        <Pressable
                            style={[styles.button, { marginBottom: 2 }]}
                            onPress={() => { handleSend(); toggleProgressIconVisibility(); }}
                        >
                            <Text style={styles.subtitle}>Send</Text>
                        </Pressable>
                    )}
                    {isProgressIconVisible && (
                        <Image
                            source={require("./assets/IMG_2416.GIF")}
                            style={styles.gifStyle}
                        />
                    )}
                    <Pressable
                        style={styles.button}
                        onPress={() => { clearAll(); }}
                    >
                        <Text style={styles.subtitle}>Slett</Text>
                    </Pressable>
                </View>
            </View>


            <View style={[styles.row, { minHeight: 50, }]}>
                <View style={[styles.col1, { flex: 2 }]}>
                </View>
                <View style={[styles.col2, { flex: 8, alignItems: 'flex-start' }]}>
                    <Text
                        style={[styles.ingress, { textAlign: 'center' }]}>
                        {textOutput}
                    </Text>
                </View>
                <View style={[styles.col1, { flex: 2 }]}>

                </View>
            </View>


        </View>
    );
}


const styles = StyleSheet.create({
    defaultStyles: {
        backgroundColor: 'red',
        padding: 20,
    },
    container: {
        alignItems: 'left',
        backgroundColor: 'red',
    },

    row: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },

    col: {
        flex: 1,
        width: 300,
        padding: 10,
        border: 1,
        textAlign: 'center'
    },
    col1: {
        minWidth: 50,
        maxWidth: 800,
        padding: 5,
        border: 1,
        textAlign: 'left',
        //backgroundColor: '#e1efe3',
        backgroundColor: '#ede5f3',
    },
    col2: {
        minWidth: 100,
        //maxWidth: 800,
        padding: 3,
        border: 1,
        textAlign: 'left',
        //backgroundColor: '#e1efe3',
        backgroundColor: '#ede5f3',
    },
    col3: {
        minWidth: 100,
        //maxWidth: 800,
        padding: 3,
        border: 1,
        //textAlign: 'left',
        //backgroundColor: '#e1efe3',
        backgroundColor: '#ede5f3',
    },

    title: {
        color: '#02636c',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 10,
    },
    ingress: {
        fontSize: 12,
        fontWeight: 'normal',
        marginBottom: 1,
        marginTop: 1,
    },
    subtitle: {
        color: 'grey',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 1,
        marginTop: 1,
    },
    role: {
        fontSize: 11,
        fontWeight: 'normal',
        marginBottom: 1,
        marginTop: 1,
        backgroundColor: '#e1efe3',
        borderRadius: 3,
        minWidth: 65,
        height: 20,
        textAlign: 'center',
        padding: 2,
    },
    body: {
        backgroundColor: 'white',
        width: '100%',
        margin: 0,
    },
    bot: {
        fontSize: 12,
        fontWeight: 'normal',
        padding: 4,
    },
    input: {
        fontSize: 12,
        fontWeight: 'normal',
        //borderWidth: 1, // får feltet til å krasje..
        borderColor: 'darkgrey',
        backgroundColor: 'white',
        marginBottom: 10,
        borderRadius: 4,
        padding: 2,
    },

    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 1,
        borderWidth: 0.5,
        borderColor: 'grey',
        borderRadius: 2,
        justifyContent: 'center',
        width: 50,
        height: 20,
    },
    btnPress: {
        alignItems: 'center',
        backgroundColor: 'red',
        padding: 1,
        borderWidth: 0.5,
        borderColor: 'grey',
        borderRadius: 2,
        justifyContent: 'center',
        width: 50,
    },
    buttonText: {
        fontSize: 25,
        fontWeight: 'bold',
        color: 'blue'
    },
    gifStyle: {
        width: 50,
        height: 25,
    },
    seperator: {
        height: 1,
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    checkbox: {
        alignSelf: 'center',
        border: '1px solid white',
    },

});


