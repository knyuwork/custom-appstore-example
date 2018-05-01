import React, { Component } from 'react';
import {
  AppRegistry,
  TouchableOpacity,
  Text,
  Button,
	View,
	Dimensions,
	ScrollView,
	FlatList,
	ListView
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {connect} from 'react-redux';
import * as Rx from "rxjs";
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import {
    LazyloadScrollView,
		LazyloadView,
		LazyloadListView
} from 'react-native-lazyload';
import * as  appActions from '../../redux/actions';

import SingleRecommendedView from './SingleRecommendedView'
import SingleListItemView from './SingleListItemView'

import { getRecommendationList, getNormalList } from '../../lib/api'
const { width, height } = Dimensions.get('window')

export class AppList extends Component {
	static navigatorStyle = {
		navBarCustomView: 'AppList.SearchBar',
	};

	state = {
		recommendedList: [],
		normalList: [],
		normalListLength: 0,
		debounced: ''
	}

	constructor(props) {
		super(props);
    this.onEndReached$ = new Rx.Subject();
    this.onEndReached = this.onEndReached.bind(this);
	}

	componentDidMount() {
		//Recommended List fetch
		getRecommendationList()
			.then(recommendedApp => {
				this.setState({
					recommendedList: recommendedApp.feed.entry
				})
			})

		//Normal List fetch
		getNormalList()
			.then(normalListApp => {
				this.setState({
					normalList: normalListApp.feed.entry
				})
			})

		this.subscription = this.onEndReached$
			.debounceTime(1100)
			.subscribe(distanceFromEnd => {
				let { normalListLength } = this.state;
				this.setState({normalListLength: normalListLength + 10})
			});
	}

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
	}
	
	onEndReached(distanceFromEnd) {
		//console.log(distanceFromEnd); 
		// let { normalListLength } = this.state;
		// //this.setState({normalListLength: normalListLength + 10})
		// console.log(this.state.normalList); 
    this.onEndReached$.next(distanceFromEnd);
	}

	renderHeader() {
		return (
			<View style={{padding: 16, borderBottomWidth: 1, borderColor: '#ddd'}}>
				<Text style={{paddingBottom: 8, fontSize: 20, fontWeight: 'bold'}}>推介</Text>
				<LazyloadScrollView
					horizontal={true}
					showsHorizontalScrollIndicator={false}
					name="lazyload-list" >
					{
						this.state.recommendedList.map((info, index) => (
							<SingleRecommendedView 
								navigator={this.props.navigator}
								key={index} info={info}/>
						))
					}
				</LazyloadScrollView>
			</View>
		);
	}
	renderItem(item, sectionID, rowID, highlightRow) {
		return ( 
			<SingleListItemView 
				key={Number(rowID)}
				navigator={this.props.navigator}rank={Number(rowID) + 1} info={item}/>
		)
	}

  render() {
		let { normalList, recommendedList, normalListLength } = this.state;
		const paginatedList = normalList.slice(0, normalListLength);
		const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
		//let dataSource = ds.cloneWithRows(paginatedList)
		let dataSource = ds.cloneWithRows(normalList)
    return (
			<LazyloadListView
				name="lazyload-listview"
				dataSource={dataSource}
				stickyHeaderIndices={[]}
				initialListSize={10}
				pageSize={10}
				enableEmptySections={true}
				scrollRenderAheadDistance={10}
				renderScrollComponent={() => <ScrollView />}
				renderHeader={() => this.renderHeader()}
				renderRow={(item, sectionID, rowID, highlightRow) => this.renderItem(item, sectionID, rowID, highlightRow)}
				onEndReachedThreshold={0}
				// onEndReached={this.onEndReached}
			/>
    );
  }

}


export default connect()(AppList);